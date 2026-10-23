import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { LoadDemoWalletDto, PayDemoWalletDto, RedeemDemoPointsDto, WalletIdentityDto } from "./demo-wallet.dto";

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("258") ? digits.slice(3) : digits;
};
const REWARDS = {
  WASH_DISCOUNT: { points: 250, creditMzn: 100, label: "Credito promocional de 100 MT para desconto parcial numa lavagem" },
} as const;
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
    const wallet = await this.prisma.demoWallet.findUnique({ where: { customerId: booking.customerId }, include: { movements: { orderBy: { createdAt: "desc" }, take: 50 }, rewardRedemptions: { orderBy: { createdAt: "desc" }, take: 20 } } });
    const loadedBalanceMzn = wallet?.loadedBalanceMzn ?? 0;
    const promoBalanceMzn = wallet?.promoBalanceMzn ?? 0;
    const mozaCreditBalanceMzn = wallet?.mozaCreditBalanceMzn ?? 0;
    return {
      demo: true,
      booking: { code: input.code, status: booking.status, service: booking.service.name, priceMzn: booking.priceMznAtBooking },
      balanceMzn: loadedBalanceMzn + promoBalanceMzn + mozaCreditBalanceMzn, loadedBalanceMzn, promoBalanceMzn, mozaCreditBalanceMzn,
      pointsBalance: wallet?.pointsBalance ?? 0,
      movements: (wallet?.movements ?? []).map(({ id, type, amount, loadedAmountMzn, promoAmountMzn, mozaCreditAmountMzn, description, createdAt }) => ({ id, type, amount, loadedAmountMzn, promoAmountMzn, mozaCreditAmountMzn, description, createdAt })),
      rewards: wallet?.rewardRedemptions ?? [],
    };
  }

  async load(input: LoadDemoWalletDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const booking = await this.verifiedBooking(input, tx);
        const replay = await tx.demoMovement.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        const wallet = await this.walletFor(booking.customerId, tx);
        if (replay) return this.getInTransaction(wallet.id, tx, booking);
        const isPromo = input.method === "PROMO_DEMO";
        await tx.demoWallet.update({ where: { id: wallet.id }, data: isPromo
          ? { promoBalanceMzn: { increment: 500 } }
          : { loadedBalanceMzn: { increment: 500 } } });
        await tx.demoMovement.create({ data: {
          walletId: wallet.id, customerId: booking.customerId, type: isPromo ? "PROMO_CREDIT" : "LOAD", amount: 500,
          loadedAmountMzn: isPromo ? 0 : 500, promoAmountMzn: isPromo ? 500 : 0,
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
        const totalBalanceMzn = wallet.loadedBalanceMzn + wallet.promoBalanceMzn + wallet.mozaCreditBalanceMzn;
        if (totalBalanceMzn < booking.priceMznAtBooking) throw new BadRequestException("O saldo demonstrativo é insuficiente.");
        const alreadyPaid = await tx.demoMovement.findFirst({ where: { bookingId: booking.id, type: "PAYMENT" } });
        if (alreadyPaid) throw new ConflictException("Esta marcação já tem um pagamento demonstrativo registado.");
        const promoAmountMzn = Math.min(wallet.promoBalanceMzn, booking.priceMznAtBooking);
        const remainingAfterPromo = booking.priceMznAtBooking - promoAmountMzn;
        const mozaCreditAmountMzn = Math.min(wallet.mozaCreditBalanceMzn, remainingAfterPromo);
        const loadedAmountMzn = remainingAfterPromo - mozaCreditAmountMzn;
        await tx.demoWallet.update({ where: { id: wallet.id }, data: {
          loadedBalanceMzn: { decrement: loadedAmountMzn },
          promoBalanceMzn: { decrement: promoAmountMzn },
          mozaCreditBalanceMzn: { decrement: mozaCreditAmountMzn },
        } });
        await tx.demoMovement.create({ data: {
          walletId: wallet.id, customerId: booking.customerId, bookingId: booking.id, type: "PAYMENT",
          amount: booking.priceMznAtBooking, loadedAmountMzn, promoAmountMzn, mozaCreditAmountMzn,
          description: `Pagamento demonstrativo: ${booking.service.name}`,
          idempotencyKey: `${input.idempotencyKey}:payment`,
        } });
        await this.awardLoyaltyForBooking(booking.id, tx);
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
      const replay = await tx.rewardRedemption.findUnique({ where: { idempotencyKey: key } });
      if (replay) return this.getInTransaction(wallet.id, tx, booking);
      const reward = REWARDS[input.reward];
      if (wallet.pointsBalance < reward.points) throw new BadRequestException(`Sao necessarios ${reward.points} pontos para esta recompensa.`);
      const code = `LJ-${randomBytes(4).toString("hex").toUpperCase()}`;
      await tx.demoWallet.update({ where: { id: wallet.id }, data: { pointsBalance: { decrement: reward.points }, ...(reward.creditMzn ? { promoBalanceMzn: { increment: reward.creditMzn } } : {}) } });
      const redemption = await tx.rewardRedemption.create({ data: { walletId: wallet.id, customerId: booking.customerId, rewardType: input.reward, pointsSpent: reward.points, promoCreditGrantedMzn: reward.creditMzn, code, idempotencyKey: key } });
      await tx.demoMovement.create({ data: { walletId: wallet.id, customerId: booking.customerId, type: "POINTS_REDEEMED", amount: reward.points, description: `${reward.label} - code ${redemption.code}`, idempotencyKey: key } });
      if (reward.creditMzn) await tx.demoMovement.create({ data: { walletId: wallet.id, customerId: booking.customerId, type: "PROMO_CREDIT", amount: reward.creditMzn, promoAmountMzn: reward.creditMzn, description: `Credito de recompensa por ${reward.points} points`, idempotencyKey: `${key}:credit` } });
      return this.getInTransaction(wallet.id, tx, booking);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async awardLoyaltyForBooking(bookingId: string, tx: Prisma.TransactionClient) {
    const booking = await tx.booking.findUnique({ where: { id: bookingId }, select: { id: true, customerId: true, publicCode: true, status: true, service: { select: { name: true } } } });
    if (!booking || booking.status !== "COMPLETED") return;
    const [walletPayment, recordedPayment] = await Promise.all([
      tx.demoMovement.findFirst({ where: { bookingId, type: "PAYMENT" }, select: { id: true } }),
      tx.recordedPayment.findUnique({ where: { bookingId }, select: { status: true, method: true, amountMzn: true } }),
    ]);
    if (!walletPayment && recordedPayment?.status !== "CONFIRMED") return;
    const wallet = await this.walletFor(booking.customerId, tx);
    const pointsKey = `loyalty:${bookingId}:points`;
    const alreadyAwarded = await tx.demoMovement.findUnique({ where: { idempotencyKey: pointsKey }, select: { id: true } });
    if (alreadyAwarded) return;
    await tx.demoWallet.update({ where: { id: wallet.id }, data: { pointsBalance: { increment: 50 } } });
    await tx.demoMovement.create({ data: { walletId: wallet.id, customerId: booking.customerId, bookingId, type: "POINTS_EARNED", amount: 50, description: `+50 pontos pela lavagem concluida: ${booking.service.name}`, idempotencyKey: pointsKey } });
    if (recordedPayment?.status === "CONFIRMED" && recordedPayment.method === "MOZA_POS_DEMO") {
      const bonusKey = `loyalty:${bookingId}:moza-credit`;
      const alreadyGranted = await tx.demoMovement.findUnique({ where: { idempotencyKey: bonusKey }, select: { id: true } });
      const bonusMzn = Math.floor(recordedPayment.amountMzn * 0.05);
      if (!alreadyGranted && bonusMzn > 0) {
        await tx.demoWallet.update({ where: { id: wallet.id }, data: { mozaCreditBalanceMzn: { increment: bonusMzn } } });
        await tx.demoMovement.create({ data: { walletId: wallet.id, customerId: booking.customerId, bookingId, type: "MOZA_BONUS_CREDIT", amount: bonusMzn, mozaCreditAmountMzn: bonusMzn, description: `Bonus demonstrativo Moza de 5% para a marcacao ${booking.publicCode}`, idempotencyKey: bonusKey } });
      }
    }
  }
  async managementSummary() {
    const [walletCount, balances, payments, recentMovements] = await Promise.all([
      this.prisma.demoWallet.count(),
      this.prisma.demoWallet.aggregate({ _sum: { loadedBalanceMzn: true, promoBalanceMzn: true, mozaCreditBalanceMzn: true, pointsBalance: true } }),
      this.prisma.demoMovement.aggregate({
        where: { type: "PAYMENT" }, _count: { _all: true }, _sum: { amount: true },
      }),
      this.prisma.demoMovement.findMany({
        orderBy: { createdAt: "desc" }, take: 8,
        select: {
          id: true, type: true, amount: true, loadedAmountMzn: true, promoAmountMzn: true, mozaCreditAmountMzn: true,
          description: true, createdAt: true,
          customer: { select: { name: true } },
          booking: { select: { publicCode: true } },
        },
      }),
    ]);
    const loadedBalanceMzn = balances._sum.loadedBalanceMzn ?? 0;
    const promoBalanceMzn = balances._sum.promoBalanceMzn ?? 0;
    const mozaCreditBalanceMzn = balances._sum.mozaCreditBalanceMzn ?? 0;
    return {
      demo: true,
      wallets: {
        count: walletCount, loadedBalanceMzn, promoBalanceMzn, mozaCreditBalanceMzn,
        totalBalanceMzn: loadedBalanceMzn + promoBalanceMzn + mozaCreditBalanceMzn,
        pointsBalance: balances._sum.pointsBalance ?? 0,
      },
      payments: { count: payments._count._all, amountMzn: payments._sum.amount ?? 0 },
      recentMovements,
    };
  }

  private async getInTransaction(walletId: string, tx: Prisma.TransactionClient, booking: { publicCode: string; status: string; priceMznAtBooking: number; service: { name: string } }) {
    const wallet = await tx.demoWallet.findUniqueOrThrow({ where: { id: walletId }, include: { movements: { orderBy: { createdAt: "desc" }, take: 50 }, rewardRedemptions: { orderBy: { createdAt: "desc" }, take: 20 } } });
    return {
      demo: true,
      booking: { code: booking.publicCode, status: booking.status, service: booking.service.name, priceMzn: booking.priceMznAtBooking },
      balanceMzn: wallet.loadedBalanceMzn + wallet.promoBalanceMzn + wallet.mozaCreditBalanceMzn,
      loadedBalanceMzn: wallet.loadedBalanceMzn,
      promoBalanceMzn: wallet.promoBalanceMzn,
      mozaCreditBalanceMzn: wallet.mozaCreditBalanceMzn,
      pointsBalance: wallet.pointsBalance,
      movements: wallet.movements.map(({ id, type, amount, loadedAmountMzn, promoAmountMzn, mozaCreditAmountMzn, description, createdAt }) => ({ id, type, amount, loadedAmountMzn, promoAmountMzn, mozaCreditAmountMzn, description, createdAt })),
      rewards: wallet.rewardRedemptions,
    };
  }
}
