import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus, Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { BookingAvailabilityDto, CreateBookingDto } from "./dto/create-booking.dto";

const ACTIVE_STATUSES: BookingStatus[] = ["REQUESTED", "ACCEPTED", "IN_PROGRESS"];
const MAPUTO_OFFSET = "+02:00";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("258") ? digits.slice(3) : digits;
}

function normalizePlate(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

function createPublicCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async availability(input: BookingAvailabilityDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: input.serviceId, isActive: true },
      select: { durationMinutes: true },
    });
    if (!service) throw new BadRequestException("Este serviço já não está disponível.");

    const dayCheck = new Date(`${input.date}T12:00:00${MAPUTO_OFFSET}`);
    if (Number.isNaN(dayCheck.getTime()) || dayCheck.toISOString().slice(0, 10) !== input.date) {
      throw new BadRequestException("A data indicada não é válida.");
    }
    const dayOpen = new Date(`${input.date}T08:00:00${MAPUTO_OFFSET}`);
    const dayClose = new Date(`${input.date}T18:00:00${MAPUTO_OFFSET}`);
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        startsAt: { lt: dayClose },
        endsAt: { gt: dayOpen },
      },
      select: { startsAt: true, endsAt: true },
    });

    const slots: string[] = [];
    const lastStart = 18 * 60 - service.durationMinutes;
    for (let minute = 8 * 60; minute <= lastStart; minute += 30) {
      const hour = String(Math.floor(minute / 60)).padStart(2, "0");
      const min = String(minute % 60).padStart(2, "0");
      const startsAt = new Date(`${input.date}T${hour}:${min}:00${MAPUTO_OFFSET}`);
      if (startsAt.getTime() <= Date.now()) continue;
      const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
      const isBusy = bookings.some((booking) => booking.startsAt < endsAt && booking.endsAt > startsAt);
      if (!isBusy) slots.push(`${hour}:${min}`);
    }

    return { date: input.date, serviceId: input.serviceId, durationMinutes: service.durationMinutes, slots };
  }

  async create(input: CreateBookingDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: input.serviceId, isActive: true },
    });
    if (!service) throw new BadRequestException("Este serviço já não está disponível.");

    const startsAt = new Date(`${input.date}T${input.time}:00${MAPUTO_OFFSET}`);
    if (Number.isNaN(startsAt.getTime()) || startsAt.toISOString().slice(0, 10) !== input.date) {
      throw new BadRequestException("A data indicada não é válida.");
    }

    const [hourText, minuteText] = input.time.split(":");
    const startMinute = Number(hourText) * 60 + Number(minuteText);
    const endMinute = startMinute + service.durationMinutes;
    const openingMinute = 8 * 60;
    const closingMinute = 18 * 60;
    if (startMinute < openingMinute || endMinute > closingMinute) {
      throw new BadRequestException("Escolha um horário entre as 08:00 e as 18:00, considerando a duração do serviço.");
    }
    if (startsAt.getTime() <= Date.now()) {
      throw new BadRequestException("Escolha uma data e hora futuras.");
    }

    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
    const phone = normalizePhone(input.phone);
    const plate = normalizePlate(input.plate);
    const name = input.name.trim().replace(/\s+/g, " ");

    try {
      return await this.prisma.$transaction(async (tx) => {
        const customer = await tx.customer.upsert({
          where: { phone },
          update: { name },
          create: { name, phone },
        });

        let vehicle = await tx.vehicle.findUnique({ where: { plate } });
        if (vehicle && vehicle.customerId !== customer.id) {
          throw new ConflictException("Esta matrícula já está associada a outro contacto.");
        }
        if (!vehicle) {
          vehicle = await tx.vehicle.create({ data: { plate, customerId: customer.id } });
        }

        const overlap = await tx.booking.findFirst({
          where: {
            status: { in: ACTIVE_STATUSES },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
          select: { id: true },
        });
        if (overlap) {
          throw new ConflictException("Este horário acabou de ficar ocupado. Escolha outro, por favor.");
        }

        let publicCode = createPublicCode();
        while (await tx.booking.findUnique({ where: { publicCode }, select: { id: true } })) {
          publicCode = createPublicCode();
        }

        const booking = await tx.booking.create({
          data: {
            publicCode,
            customerId: customer.id,
            vehicleId: vehicle.id,
            serviceId: service.id,
            startsAt,
            endsAt,
            priceMznAtBooking: service.priceMzn,
            durationAtBooking: service.durationMinutes,
          },
          include: { service: { select: { name: true } }, vehicle: { select: { plate: true } } },
        });

        await tx.customerNotification.create({ data: {
          customerId: customer.id,
          bookingId: booking.id,
          title: "Pedido de pré-marcação recebido",
          message: `Recebemos o pedido ${booking.publicCode}. A equipa vai confirmar a disponibilidade.`,
        } });

        return {
          code: booking.publicCode,
          status: booking.status,
          customerName: name,
          phone,
          plate: booking.vehicle.plate,
          service: booking.service.name,
          startsAt: booking.startsAt.toISOString(),
          endsAt: booking.endsAt.toISOString(),
          priceMzn: booking.priceMznAtBooking,
          durationMinutes: booking.durationAtBooking,
          createdAt: booking.createdAt.toISOString(),
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2034") {
          throw new ConflictException("Este horário acabou de ficar ocupado. Escolha outro, por favor.");
        }
        if (error.code === "P2002") {
          throw new ConflictException("Não foi possível concluir o pedido. Verifique os dados e tente novamente.");
        }
      }
      throw error;
    }
  }

  async findForCustomer(code: string, rawPhone: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { publicCode: code, customer: { phone: normalizePhone(rawPhone) } },
      include: {
        service: { select: { name: true } },
        vehicle: { select: { plate: true } },
        customer: { select: { name: true, phone: true } },
      },
    });
    if (!booking) throw new NotFoundException("Não encontrámos uma marcação com esses dados.");
    return {
      code: booking.publicCode,
      status: booking.status,
      customerName: booking.customer.name,
      plate: booking.vehicle.plate,
      service: booking.service.name,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      priceMzn: booking.priceMznAtBooking,
      durationMinutes: booking.durationAtBooking,
    };
  }

  async findCustomerHistory(code: string, rawPhone: string) {
    const phone = normalizePhone(rawPhone);
    const current = await this.prisma.booking.findFirst({
      where: { publicCode: code, customer: { is: { phone } } },
      select: { customerId: true },
    });
    if (!current) throw new NotFoundException("NÃ£o encontrÃ¡mos uma marcaÃ§Ã£o com esses dados.");

    const bookings = await this.prisma.booking.findMany({
      where: { customerId: current.customerId },
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      take: 50,
      include: {
        service: { select: { name: true } },
        vehicle: { select: { plate: true } },
        customer: { select: { name: true } },
      },
    });
    return bookings.map((booking) => ({
      code: booking.publicCode,
      status: booking.status,
      customerName: booking.customer.name,
      plate: booking.vehicle.plate,
      service: booking.service.name,
      startsAt: booking.startsAt.toISOString(),
      priceMzn: booking.priceMznAtBooking,
      durationMinutes: booking.durationAtBooking,
    }));
  }

  async listForManagement() {
    return this.prisma.booking.findMany({
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        service: { select: { name: true } },
        vehicle: { select: { plate: true } },
        customer: { select: { name: true, phone: true } },
      },
    });
  }

  async managementSummary() {
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Maputo" }).format(new Date());
    const dayStart = new Date(`${date}T00:00:00${MAPUTO_OFFSET}`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000);
    const [today, requestsPending, accepted, inProgress, completedToday, estimated, demoPayments, recentBookings] = await Promise.all([
      this.prisma.booking.count({ where: { startsAt: { gte: dayStart, lt: dayEnd } } }),
      this.prisma.booking.count({ where: { status: "REQUESTED" } }),
      this.prisma.booking.count({ where: { status: "ACCEPTED" } }),
      this.prisma.booking.count({ where: { status: "IN_PROGRESS" } }),
      this.prisma.booking.count({ where: { status: "COMPLETED", updatedAt: { gte: dayStart, lt: dayEnd } } }),
      this.prisma.booking.aggregate({ where: { startsAt: { gte: dayStart, lt: dayEnd }, status: { notIn: ["CANCELLED", "REJECTED"] } }, _sum: { priceMznAtBooking: true } }),
      this.prisma.demoMovement.aggregate({ where: { type: "PAYMENT", createdAt: { gte: dayStart, lt: dayEnd } }, _count: { _all: true }, _sum: { amount: true } }),
      this.prisma.booking.findMany({
        orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }], take: 6,
        select: { publicCode: true, status: true, startsAt: true, priceMznAtBooking: true,
          service: { select: { name: true } }, vehicle: { select: { plate: true } }, customer: { select: { name: true } } },
      }),
    ]);
    return {
      today: { bookings: today, completed: completedToday, estimatedServiceValueMzn: estimated._sum.priceMznAtBooking ?? 0 },
      queue: { requestsPending, accepted, inProgress },
      simulatedPaymentsToday: { count: demoPayments._count._all, amountMzn: demoPayments._sum.amount ?? 0 },
      recentBookings,
      generatedAt: new Date().toISOString(),
    };
  }

  async updateRequestStatus(id: string, status: "ACCEPTED" | "REJECTED") {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.updateMany({ where: { id, status: "REQUESTED" }, data: { status } });
      if (result.count === 0) {
        const existing = await tx.booking.findUnique({ where: { id }, select: { id: true } });
        if (!existing) throw new NotFoundException("Marcação não encontrada.");
        throw new ConflictException("Este pedido já foi tratado e não pode ser alterado nesta etapa.");
      }
      const booking = await tx.booking.findUniqueOrThrow({ where: { id }, include: {
        service: { select: { name: true } }, vehicle: { select: { plate: true } },
        customer: { select: { id: true, name: true, phone: true } },
      } });
      await tx.customerNotification.create({ data: {
        customerId: booking.customer.id, bookingId: booking.id,
        title: status === "ACCEPTED" ? "Pré-marcação aceite" : "Pré-marcação não aceite",
        message: status === "ACCEPTED"
          ? `A equipa aceitou o pedido ${booking.publicCode}. Consulte o acompanhamento para ver as próximas actualizações.`
          : `A equipa não conseguiu aceitar o pedido ${booking.publicCode}. Contacte o Lava Já para mais informações.`,
      } });
      return booking;
    });
  }

  async updateOperationalStatus(id: string, status: "IN_PROGRESS" | "COMPLETED") {
    const fromStatus: BookingStatus = status === "IN_PROGRESS" ? "ACCEPTED" : "IN_PROGRESS";
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.updateMany({ where: { id, status: fromStatus }, data: { status } });
      if (result.count === 0) {
        const existing = await tx.booking.findUnique({ where: { id }, select: { id: true } });
        if (!existing) throw new NotFoundException("Marcação não encontrada.");
        throw new ConflictException(status === "IN_PROGRESS"
          ? "Apenas uma marcação aceite pode iniciar atendimento."
          : "Apenas uma marcação em atendimento pode ser concluída.");
      }
      const booking = await tx.booking.findUniqueOrThrow({
        where: { id },
        include: {
          service: { select: { name: true } },
          vehicle: { select: { plate: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
      });
      const notification = status === "IN_PROGRESS"
        ? { title: "Atendimento iniciado", message: `A lavagem da viatura ${booking.vehicle.plate} começou no Lava Já.` }
        : { title: "Serviço concluído", message: `O serviço ${booking.service.name} para a viatura ${booking.vehicle.plate} foi concluído.` };
      await tx.customerNotification.create({ data: { customerId: booking.customer.id, bookingId: booking.id, ...notification } });
      return booking;
    });
  }
}
