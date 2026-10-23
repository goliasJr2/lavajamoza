import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreatePromotionCampaignDto } from "./create-promotion-campaign.dto";
import { NotificationIdentityDto } from "./notifications.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Query() query: NotificationIdentityDto) {
    return this.notifications.list(query);
  }

  @Patch("read-all")
  markAllRead(@Body() input: NotificationIdentityDto) {
    return this.notifications.markAllRead(input);
  }

  @Get("campaigns/manage")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  listCampaigns() {
    return this.notifications.listCampaigns();
  }

  @Post("campaigns")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  createCampaign(@Body() input: CreatePromotionCampaignDto) {
    return this.notifications.createCampaign(input);
  }

  @Patch("campaigns/:id/cancel")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  cancelCampaign(@Param("id") id: string) {
    return this.notifications.cancelCampaign(id);
  }
}
