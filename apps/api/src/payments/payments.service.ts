import { ConflictException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { WalletService } from "../wallet/wallet.service";

const bookingServiceLabel = (booking: { serviceNamesAtBooking: string[]; service: { name: string } }) => booking.serviceNamesAtBooking.length ? booking.serviceNamesAtBooking.join(" + ") : booking.service.name;

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly wallet: WalletService) {}

  async list() {
    const payments = await this.prisma.recordedPayment.findMany({
      orderBy: { createdAt: "desc" }, take: 100,
      include: { staff: { select: { email: true } }, booking: { select: { publicCode: true, priceMznAtBooking: true, serviceNamesAtBooking: true, service: { select: { name: true } }, customer: { select: { name: true } } } } },
    });
    return payments.map((payment) => ({ ...payment, booking: { ...payment.booking, service: { name: bookingServiceLabel(payment.booking) } } }));
  }

  async requestMozaDemo(code: string, rawPhone: string) {
    const phone = rawPhone.replace(/\D/g, "").replace(/^258/, "");
    const booking = await this.prisma.booking.findFirst({ where: { publicCode: code, customer: { is: { phone } } }, select: { id: true, status: true, priceMznAtBooking: true } });
    if (!booking) throw new NotFoundException("Não foi possível validar os dados da marcação.");
    if (booking.status !== "ACCEPTED" && booking.status !== "COMPLETED") throw new BadRequestException("O pedido de pagamento fica disponível quando a marcação for aceite.");
    const walletPayment = await this.prisma.demoMovement.findFirst({ where: { bookingId: booking.id, type: "PAYMENT" }, select: { id: true } });
    if (walletPayment) throw new ConflictException("Esta marcação já foi paga através da carteira demonstrativa.");
    const existing = await this.prisma.recordedPayment.findUnique({ where: { bookingId: booking.id } });
    if (existing) return { status: existing.status, amountMzn: existing.amountMzn, method: existing.method, demo: existing.method === "MOZA_POS_DEMO" };
    const payment = await this.prisma.recordedPayment.create({ data: { bookingId: booking.id, method: "MOZA_POS_DEMO", status: "PENDING", amountMzn: booking.priceMznAtBooking } });
    return { status: payment.status, amountMzn: payment.amountMzn, method: payment.method, demo: true };
  }

  async mozaDemoStatus(code: string, rawPhone: string) {
    const phone = rawPhone.replace(/\D/g, "").replace(/^258/, "");
    const booking = await this.prisma.booking.findFirst({ where: { publicCode: code, customer: { is: { phone } } }, select: { id: true } });
    if (!booking) throw new NotFoundException("Não foi possível validar os dados da marcação.");
    const payment = await this.prisma.recordedPayment.findUnique({ where: { bookingId: booking.id }, select: { status: true, amountMzn: true, method: true } });
    return payment?.method === "MOZA_POS_DEMO" ? { status: payment.status, amountMzn: payment.amountMzn, demo: true } : { status: "NOT_REQUESTED", amountMzn: null, demo: true };
  }

  async confirmMozaDemo(id: string, staffUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const pending = await tx.recordedPayment.updateMany({ where: { id, method: "MOZA_POS_DEMO", status: "PENDING" }, data: { status: "CONFIRMED", staffUserId } });
      if (!pending.count) {
        const existing = await tx.recordedPayment.findUnique({ where: { id }, select: { id: true } });
        if (!existing) throw new NotFoundException("Pedido de pagamento nao encontrado.");
        throw new ConflictException("Este pedido ja foi confirmado ou nao pertence ao fluxo Moza demonstrativo.");
      }
      const payment = await tx.recordedPayment.findUniqueOrThrow({
        where: { id },
        include: { staff: { select: { email: true } }, booking: { select: { id: true, publicCode: true, serviceNamesAtBooking: true, service: { select: { name: true } }, customer: { select: { name: true } } } } },
      });
      await this.wallet.awardLoyaltyForBooking(payment.booking.id, tx);
      return { ...payment, booking: { ...payment.booking, service: { name: bookingServiceLabel(payment.booking) } } };
    });
  }

  async create(bookingId: string, staffUserId: string, method: "CASH" | "OTHER") {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId }, select: { id: true, status: true, priceMznAtBooking: true } });
    if (!booking) throw new NotFoundException("Marcacao nao encontrada.");
    if (booking.status !== "ACCEPTED" && booking.status !== "COMPLETED") throw new BadRequestException("So e possivel registar o pagamento de uma marcacao aceite ou concluida.");
    const demoPayment = await this.prisma.demoMovement.findFirst({ where: { bookingId, type: "PAYMENT" }, select: { id: true } });
    if (demoPayment) throw new ConflictException("Esta marcacao ja foi paga pela carteira demonstrativa.");
    try {
      return await this.prisma.$transaction(async (tx) => {
        const payment = await tx.recordedPayment.create({ data: { bookingId, staffUserId, method, amountMzn: booking.priceMznAtBooking }, include: { staff: { select: { email: true } }, booking: { select: { id: true, publicCode: true, serviceNamesAtBooking: true, service: { select: { name: true } }, customer: { select: { name: true } } } } } });
        await this.wallet.awardLoyaltyForBooking(bookingId, tx);
        return { ...payment, booking: { ...payment.booking, service: { name: bookingServiceLabel(payment.booking) } } };
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new ConflictException("Ja existe um pagamento registado para esta marcacao.");
      throw error;
    }
  }
}
