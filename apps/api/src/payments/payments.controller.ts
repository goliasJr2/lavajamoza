import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedStaff } from "../auth/jwt.strategy";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateRecordedPaymentDto, MozaDemoRequestDto } from "./payments.dto";
import { PaymentsService } from "./payments.service";

@Controller("payments/manage")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Get() list() { return this.payments.list(); }
  @Post() create(@Body() input: CreateRecordedPaymentDto, @Req() request: { user: AuthenticatedStaff }) { return this.payments.create(input.bookingId, request.user.sub, input.method); }
  @Patch(":id/confirm-moza-demo") confirm(@Param("id") id: string, @Req() request: { user: AuthenticatedStaff }) { return this.payments.confirmMozaDemo(id, request.user.sub); }
}

@Controller("payments/demo/moza")
export class MozaDemoPaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post() request(@Body() input: MozaDemoRequestDto) { return this.payments.requestMozaDemo(input.code, input.phone); }
  @Get() status(@Query() input: MozaDemoRequestDto) { return this.payments.mozaDemoStatus(input.code, input.phone); }
}
