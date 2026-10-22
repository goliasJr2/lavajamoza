import { Body, Controller, Get, Patch, Query } from "@nestjs/common";
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
}
