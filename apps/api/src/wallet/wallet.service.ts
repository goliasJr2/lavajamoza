import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LoadDemoWalletDto, PayDemoWalletDto, RedeemDemoPointsDto, WalletIdentityDto } from "./demo-wallet.dto";

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("258") ? digits.slice(3) : digits;
};
const METHOD_LABEL = { MOZA_DEMO: "Moza Banco (demonstração)", MPESA_DEMO: "M-Pesa (demonstração)", EMOLA_DEMO: "e-Mola (demonstração)", PROMO_DEMO: "Crédito promocional (demonstração)" };

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifiedBooking(input: WalletIdentityDto, client: Prisma.TransactionClient | PrismaService = this.prisma) {
    const booking = await client.booking.findFirst({
      where: { publicCode: input.code, customer: { is: { phone: normalizePhone(input.phone) } } },
      select: { id: true, publicCode: true, customerId: true, status: true, priceMznAtBooking: true, service: { select: { name: true } } },
    });
    if (!booking) throw new NotFoundException("Não encontrámos uma marcação com esses dados.");
    return booking;
  }

  private async walletFor(customerId: string, tx: Prisma.TransactionClient) {
    return tx.demoWallet.upsert({ where: { customerId }, update: {}, create: { customerId } });
  }

  async get(input: WalletIdentityDto) {
    const booking = await this.verifiedBooking(input);
    const wallet = await this.prisma.demoWallet.findUnique({ where: { customerId: booking.customerId }, include: { movements: { orderBy: { createdAt: "desc" }, take: 50 } } });
    return { demo: true, booking: { code: input.code, status: booking.status, service: booking.service.name, priceMzn: booking.priceMznAtBooking }, balanceMzn: wallet?.balanceMzn ?? 0, pointsBalance: wallet?.pointsBalance ?? 0, movements: (wallet?.movements ?? []).map(({ id, type, amount, description, createdAt }) => ({ id, type, amount, description, createdAt })) };
  }

  async load(input: LoadDemoWalletDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const booking = await this.verifiedBooking(input, tx);
        const replay = await tx.demoMovement.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        const wallet = await this.walletFor(booking.customerId, tx);
        if (replay) return this.getInTransaction(wallet.id, tx, booking);
        await tx.demoWallet.update({ where: { id: wallet.id }, data: { balanceMzn: { increment: 500 } } });
        await tx.demoMovement.create({ data: {
          walletId: wallet.id, customerId: booking.customerId, type: "LOAD", amount: 500,
          description: `Carregamento de 500 MT via ${METHOD_LABEL[input.method]}`,
          idempotencyKey: input.idempotencyKey,
        } });
        return this.getInTransaction(wallet.id, tx, booking);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") throw new ConflictException("A operação foi concorrente. Consulte o saldo e tente novamente.");
      throw error;
    }
  }

  async pay(input: PayDemoWalletDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const booking = await this.verifiedBooking(input, tx);
        const replay = await tx.demoMovement.findUnique({ where: { idempotencyKey: `${input.idempotencyKey}:payment` } });
        const wallet = await this.walletFor(booking.customerId, tx);
        if (replay) return this.getInTransaction(wallet.id, tx, booking);
        if (!["ACCEPTED", "COMPLETED"].includes(booking.status)) throw new BadRequestException("Só é possível simular o pagamento de uma marcação aceite ou concluída.");
        if (wallet.balanceMzn < booking.priceMznAtBooking) throw new BadRequestException("O saldo demonstrativo é insuficiente.");
        const alreadyPaid = await tx.demoMovement.findFirst({ where: { bookingId: booking.id, type: "PAYMENT" } });
        if (alreadyPaid) throw new ConflictException("Esta marcação já tem um pagamento demonstrativo registado.");
        const points = Math.floor(booking.priceMznAtBooking / 100);
        await tx.demoWallet.update({ where: { id: wallet.id }, data: { balanceMzn: { decrement: booking.priceMznAtBooking }, pointsBalance: { increment: points } } });
        await tx.demoMovement.create({ data: {
          walletId: wallet.id, customerId: booking.customerId, bookingId: booking.id, type: "PAYMENT",
          amount: booking.priceMznAtBooking, description: `Pagamento demonstrativo: ${booking.service.name}`,
          idempotencyKey: `${input.idempotencyKey}:payment`,
        } });
        if (points > 0) await tx.demoMovement.create({ data: {
          walletId: wallet.id, customerId: booking.customerId, bookingId: booking.id, type: "POINTS_EARNED",
          amount: points, description: "Pontos demonstrativos pela utilização do serviço",
          idempotencyKey: `${input.idempotencyKey}:points`,
        } });
        return this.getInTransaction(wallet.id, tx, booking);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") throw new ConflictException("A operação foi concorrente. Consulte o saldo e tente novamente.");
      throw error;
    }
  }

  async redeem(input: RedeemDemoPointsDto) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await this.verifiedBooking(input, tx);
      const wallet = await this.walletFor(booking.customerId, tx);
      const key = `${input.idempotencyKey}:redeem`;
      const replay = await tx.demoMovement.findUnique({ where: { idempotencyKey: key } });
      if (replay) return this.getInTransaction(wallet.id, tx, booking);
      if (wallet.pointsBalance < 500) throw new BadRequestException("São necessários 500 pontos demonstrativos para resgatar esta recompensa.");
      await tx.demoWallet.update({ where: { id: wallet.id }, data: { pointsBalance: { decrement: 500 } } });
      await tx.demoMovement.create({ data: {
        walletId: wallet.id, customerId: booking.customerId, type: "POINTS_REDEEMED", amount: 500,
        description: "Recompensa demonstrativa: benefício de lavagem resgatado",
        idempotencyKey: key,
      } });
      return this.getInTransaction(wallet.id, tx, booking);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async getInTransaction(walletId: string, tx: Prisma.TransactionClient, booking: { publicCode: string; status: string; priceMznAtBooking: number; service: { name: string } }) {
    const wallet = await tx.demoWallet.findUniqueOrThrow({ where: { id: walletId }, include: { movements: { orderBy: { createdAt: "desc" }, take: 50 } } });
    return { demo: true, booking: { code: booking.publicCode, status: booking.status, service: booking.service.name, priceMzn: booking.priceMznAtBooking }, balanceMzn: wallet.balanceMzn, pointsBalance: wallet.pointsBalance, movements: wallet.movements.map(({ id, type, amount, description, createdAt }) => ({ id, type, amount, description, createdAt })) };
  }
}
