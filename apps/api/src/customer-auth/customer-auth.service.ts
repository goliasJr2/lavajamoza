import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { BusinessRegisterDto, CreateBookingRatingDto, CustomerLoginDto, CustomerRegisterDto, FleetVehicleDto } from "./customer-auth.dto";
import { NotFoundException as NotFound } from "@nestjs/common";

function normalizePhone(value: string) { const digits = value.replace(/\D/g, ""); return digits.startsWith("258") ? digits.slice(3) : digits; }

@Injectable()
export class CustomerAuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(input: CustomerRegisterDto) {
    const phone = normalizePhone(input.phone);
    const booking = await this.prisma.booking.findFirst({ where: { publicCode: input.code, customer: { is: { phone } } }, select: { customerId: true } });
    if (!booking) throw new UnauthorizedException("Não foi possível validar a marcação com estes dados.");
    const passwordHash = await hash(input.password, 12);
    const result = await this.prisma.customer.updateMany({ where: { id: booking.customerId, passwordHash: null }, data: { passwordHash } });
    if (!result.count) throw new ConflictException("Já existe uma conta para este contacto. Entre com a palavra-passe.");
    const customer = await this.prisma.customer.findUniqueOrThrow({ where: { id: booking.customerId } });
    return this.issueToken(customer);
  }

  async login(input: CustomerLoginDto) {
    const customer = await this.prisma.customer.findUnique({ where: { phone: normalizePhone(input.phone) } });
    const valid = customer?.passwordHash ? await compare(input.password, customer.passwordHash) : false;
    if (customer?.accountStatus === "PENDING") throw new ForbiddenException("Business account awaits admin approval.");
    if (customer?.accountStatus === "REJECTED") throw new ForbiddenException("Business account request was rejected.");
    if (!customer || !valid) throw new UnauthorizedException("Telefone ou palavra-passe inválidos.");
    return this.issueToken(customer);
  }

  async registerBusiness(input: BusinessRegisterDto) {
    const phone = normalizePhone(input.phone);
    const existing = await this.prisma.customer.findUnique({ where: { phone } });
    if (existing?.passwordHash) throw new ConflictException("JÃ¡ existe uma conta com este telefone. Entre na conta existente.");
    if (existing?.accountType === "BUSINESS") throw new ConflictException("JÃ¡ existe um pedido empresarial associado a este telefone.");
    const passwordHash = await hash(input.password, 12);
    try {
      if (existing) await this.prisma.customer.update({ where: { id: existing.id }, data: { name: input.contactName.trim(), passwordHash, accountType: "BUSINESS", accountStatus: "PENDING", businessName: input.businessName.trim(), nuit: input.nuit, businessReviewedAt: null, businessReviewedById: null } });
      else await this.prisma.customer.create({ data: { name: input.contactName.trim(), phone, passwordHash, accountType: "BUSINESS", accountStatus: "PENDING", businessName: input.businessName.trim(), nuit: input.nuit } });
      return { status: "PENDING", message: "Pedido enviado. PoderÃ¡ entrar quando o administrador aprovar a conta." };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ConflictException("Este NUIT jÃ¡ estÃ¡ associado a uma conta.");
      throw error;
    }
  }

  async listBusinessAccounts() {
    return this.prisma.customer.findMany({ where: { accountType: "BUSINESS" }, orderBy: [{ accountStatus: "asc" }, { createdAt: "desc" }], select: { id: true, name: true, phone: true, businessName: true, nuit: true, accountStatus: true, createdAt: true, businessReviewedAt: true, _count: { select: { vehicles: true, bookings: true } } } });
  }

  async reviewBusiness(id: string, decision: "APPROVE" | "REJECT", staffId: string) {
    const account = await this.prisma.customer.findUnique({ where: { id }, select: { id: true, accountType: true } });
    if (!account || account.accountType !== "BUSINESS") throw new NotFoundException("Conta empresarial nÃ£o encontrada.");
    return this.prisma.customer.update({ where: { id }, data: { accountStatus: decision === "APPROVE" ? "ACTIVE" : "REJECTED", businessReviewedAt: new Date(), businessReviewedById: staffId }, select: { id: true, name: true, phone: true, businessName: true, nuit: true, accountStatus: true, businessReviewedAt: true } });
  }

  async fleet(customerId: string) {
    await this.assertActiveBusiness(customerId);
    return this.prisma.vehicle.findMany({ where: { customerId, isActive: true }, orderBy: { createdAt: "desc" }, select: { id: true, plate: true, createdAt: true, _count: { select: { bookings: true } } } });
  }

  async addFleetVehicle(customerId: string, input: FleetVehicleDto) {
    await this.assertActiveBusiness(customerId);
    const plate = input.plate.replace(/[\s-]/g, "").toUpperCase();
    const existing = await this.prisma.vehicle.findUnique({ where: { plate }, select: { id: true, customerId: true, isActive: true } });
    if (existing) {
      if (existing.customerId !== customerId) throw new ConflictException("Esta matrÃ­cula jÃ¡ estÃ¡ associada a outra conta.");
      if (!existing.isActive) return this.prisma.vehicle.update({ where: { id: existing.id }, data: { isActive: true }, select: { id: true, plate: true, createdAt: true } });
      throw new ConflictException("Esta viatura jÃ¡ estÃ¡ na frota.");
    }
    try { return await this.prisma.vehicle.create({ data: { customerId, plate }, select: { id: true, plate: true, createdAt: true } }); }
    catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ConflictException("Esta matrÃ­cula jÃ¡ estÃ¡ associada a uma conta."); throw error; }
  }

  async deactivateFleetVehicle(customerId: string, vehicleId: string) {
    await this.assertActiveBusiness(customerId);
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, customerId, isActive: true }, select: { id: true } });
    if (!vehicle) throw new NotFoundException("Viatura nÃ£o encontrada.");
    return this.prisma.vehicle.update({ where: { id: vehicleId }, data: { isActive: false }, select: { id: true, plate: true, isActive: true } });
  }

  async createRating(input: CreateBookingRatingDto) {
    const phone = normalizePhone(input.phone);
    const booking = await this.prisma.booking.findFirst({ where: { publicCode: input.code, customer: { phone } }, select: { id: true, customerId: true, status: true, rating: { select: { id: true } } } });
    if (!booking) throw new NotFoundException("NÃ£o encontrÃ¡mos uma marcaÃ§Ã£o com esses dados.");
    if (booking.status !== "COMPLETED") throw new ConflictException("SÃ³ pode avaliar uma lavagem concluÃ­da.");
    if (booking.rating) throw new ConflictException("Esta lavagem jÃ¡ foi avaliada.");
    try { return await this.prisma.bookingRating.create({ data: { bookingId: booking.id, customerId: booking.customerId, score: input.score, comment: input.comment?.trim() || null }, select: { id: true, score: true, comment: true, createdAt: true } }); }
    catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ConflictException("Esta lavagem jÃ¡ foi avaliada."); throw error; }
  }

  async ratingsSummary() {
    const [aggregate, distribution, total, ratings] = await Promise.all([
      this.prisma.bookingRating.aggregate({ _avg: { score: true }, _count: { _all: true } }),
      this.prisma.bookingRating.groupBy({ by: ["score"], _count: { _all: true }, orderBy: { score: "desc" } }),
      this.prisma.booking.count({ where: { status: "COMPLETED" } }),
      this.prisma.bookingRating.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, score: true, comment: true, createdAt: true, booking: { select: { publicCode: true, startsAt: true, service: { select: { name: true } }, vehicle: { select: { plate: true } } } }, customer: { select: { name: true, businessName: true, accountType: true } } } }),
    ]);
    return { averageScore: aggregate._avg.score ?? 0, ratingCount: aggregate._count._all, completedBookings: total, responseRate: total ? Math.round(aggregate._count._all / total * 100) : 0, distribution: [5, 4, 3, 2, 1].map((score) => ({ score, count: distribution.find((entry) => entry.score === score)?._count._all ?? 0 })), ratings };
  }

  private async assertActiveBusiness(customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId }, select: { accountType: true, accountStatus: true } });
    if (!customer || customer.accountType !== "BUSINESS") throw new ForbiddenException("Esta funcionalidade estÃ¡ disponÃ­vel para contas empresariais.");
    if (customer.accountStatus !== "ACTIVE") throw new ForbiddenException("A conta empresarial ainda nÃ£o estÃ¡ activa.");
  }

  async profile(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id }, select: {
      id: true, name: true, phone: true, cardCode: true, createdAt: true, accountType: true, accountStatus: true, businessName: true, nuit: true,
      vehicles: { where: { isActive: true }, orderBy: { createdAt: "desc" }, select: { id: true, plate: true } },
      bookings: { orderBy: { startsAt: "desc" }, take: 50, select: { publicCode: true, status: true, startsAt: true, priceMznAtBooking: true, durationAtBooking: true, rating: { select: { score: true, comment: true } }, service: { select: { name: true } }, vehicle: { select: { plate: true } } } },
      demoWallet: { select: { loadedBalanceMzn: true, promoBalanceMzn: true, mozaCreditBalanceMzn: true, pointsBalance: true } },
    } });
    if (!customer) throw new NotFoundException("Perfil de cliente não encontrado.");
    return customer;
  }

  async bookingIdentity(customerId: string, code: string) {
    const booking = await this.prisma.booking.findFirst({ where: { customerId, publicCode: code }, select: { publicCode: true, customer: { select: { phone: true } } } });
    if (!booking) throw new NotFound("Marcação não encontrada na sua conta.");
    return { code: booking.publicCode, phone: booking.customer.phone };
  }

  async card(customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId }, select: { name: true, cardCode: true } });
    if (!customer) throw new NotFound("Perfil não encontrado.");
    return { name: customer.name, identifier: customer.cardCode, status: "ACTIVE" as const };
  }

  async notifications(customerId: string) {
    const notifications = await this.prisma.customerNotification.findMany({ where: { customerId, availableAt: { lte: new Date() } }, orderBy: { availableAt: "desc" }, take: 50, select: { id: true, type: true, title: true, message: true, actionUrl: true, availableAt: true, readAt: true, createdAt: true, booking: { select: { publicCode: true } } } });
    return { notifications, unreadCount: notifications.filter((item) => !item.readAt).length };
  }

  async markNotificationsRead(customerId: string) {
    const result = await this.prisma.customerNotification.updateMany({ where: { customerId, readAt: null, availableAt: { lte: new Date() } }, data: { readAt: new Date() } });
    return { updated: result.count };
  }

  private async issueToken(customer: { id: string; name: string; phone: string }) {
    const accessToken = await this.jwt.signAsync({ sub: customer.id, phone: customer.phone, role: "CUSTOMER" });
    return { accessToken, user: { id: customer.id, name: customer.name, phone: customer.phone, role: "CUSTOMER" as const } };
  }
}
