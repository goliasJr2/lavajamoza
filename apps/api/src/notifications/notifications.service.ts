import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationIdentityDto } from "./notifications.dto";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("258") ? digits.slice(3) : digits;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async customerFor(input: NotificationIdentityDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { publicCode: input.code, customer: { is: { phone: normalizePhone(input.phone) } } },
      select: { customerId: true },
    });
    if (!booking) throw new NotFoundException("Não encontrámos uma marcação com esses dados.");
    return booking.customerId;
  }

  async list(input: NotificationIdentityDto) {
    const customerId = await this.customerFor(input);
    const notifications = await this.prisma.customerNotification.findMany({
      where: { customerId }, orderBy: { createdAt: "desc" }, take: 50,
      select: { id: true, title: true, message: true, readAt: true, createdAt: true, booking: { select: { publicCode: true } } },
    });
    return { notifications, unreadCount: notifications.filter((item) => !item.readAt).length };
  }

  async markAllRead(input: NotificationIdentityDto) {
    const customerId = await this.customerFor(input);
    const result = await this.prisma.customerNotification.updateMany({ where: { customerId, readAt: null }, data: { readAt: new Date() } });
    return { updated: result.count };
  }
}
