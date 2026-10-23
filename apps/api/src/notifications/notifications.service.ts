import { ConflictException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationIdentityDto } from "./notifications.dto";
import { CreatePromotionCampaignDto } from "./create-promotion-campaign.dto";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("258") ? digits.slice(3) : digits;
}

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private dispatchTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.dispatchDueCampaigns();
    this.dispatchTimer = setInterval(() => { void this.dispatchDueCampaigns(); }, 30_000);
  }

  onModuleDestroy() {
    if (this.dispatchTimer) clearInterval(this.dispatchTimer);
  }

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
      where: { customerId, availableAt: { lte: new Date() } }, orderBy: { availableAt: "desc" }, take: 50,
      select: { id: true, type: true, title: true, message: true, actionUrl: true, availableAt: true, readAt: true, createdAt: true, booking: { select: { publicCode: true } } },
    });
    return { notifications, unreadCount: notifications.filter((item) => !item.readAt).length };
  }

  async markAllRead(input: NotificationIdentityDto) {
    const customerId = await this.customerFor(input);
    const result = await this.prisma.customerNotification.updateMany({ where: { customerId, readAt: null, availableAt: { lte: new Date() } }, data: { readAt: new Date() } });
    return { updated: result.count };
  }

  async listCampaigns() {
    await this.dispatchDueCampaigns();
    return this.prisma.promotionCampaign.findMany({ orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }], take: 50 });
  }

  async createCampaign(input: CreatePromotionCampaignDto) {
    const scheduledAt = new Date(input.scheduledAt);
    if (scheduledAt <= new Date()) throw new ConflictException("A data de envio deve estar no futuro.");
    return this.prisma.promotionCampaign.create({ data: {
      title: input.title.trim(), message: input.message.trim(), scheduledAt,
      actionUrl: input.actionUrl?.trim() || null,
    } });
  }

  async cancelCampaign(id: string) {
    const result = await this.prisma.promotionCampaign.updateMany({ where: { id, status: "SCHEDULED" }, data: { status: "CANCELLED" } });
    if (!result.count) {
      const campaign = await this.prisma.promotionCampaign.findUnique({ where: { id }, select: { id: true } });
      if (!campaign) throw new NotFoundException("Campanha não encontrada.");
      throw new ConflictException("Só é possível cancelar uma campanha ainda agendada.");
    }
    return this.prisma.promotionCampaign.findUniqueOrThrow({ where: { id } });
  }

  private async dispatchDueCampaigns() {
    try {
      await this.prisma.$transaction(async (tx) => {
        const now = new Date();
        const campaigns = await tx.promotionCampaign.findMany({
          where: { status: "SCHEDULED", scheduledAt: { lte: now } },
          orderBy: { scheduledAt: "asc" }, take: 20,
        });
        for (const campaign of campaigns) {
          const claimed = await tx.promotionCampaign.updateMany({
            where: { id: campaign.id, status: "SCHEDULED" },
            data: { status: "SENT", sentAt: now },
          });
          if (!claimed.count) continue;
          const customers = await tx.customer.findMany({ select: { id: true } });
          if (customers.length) {
            await tx.customerNotification.createMany({ data: customers.map(({ id: customerId }) => ({
              customerId, campaignId: campaign.id, type: "PROMOTION" as const,
              title: campaign.title, message: campaign.message,
              actionUrl: campaign.actionUrl, availableAt: now,
            })) });
          }
          await tx.promotionCampaign.update({ where: { id: campaign.id }, data: { recipientCount: customers.length } });
        }
      });
    } catch (error) {
      console.error("Não foi possível processar notificações programadas.", error);
    }
  }
}
