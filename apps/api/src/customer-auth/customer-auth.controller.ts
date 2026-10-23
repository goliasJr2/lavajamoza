import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedStaff } from "../auth/jwt.strategy";
import { CustomerAuthGuard } from "./customer-auth.guard";
import { BusinessRegisterDto, BusinessReviewDto, CustomerBookingQueryDto, CustomerLoginDto, CustomerRegisterDto, CustomerWalletOperationDto, FleetVehicleDto, CreateBookingRatingDto } from "./customer-auth.dto";
import { CustomerAuthService } from "./customer-auth.service";
import { WalletService } from "../wallet/wallet.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";

@Controller("customer-auth")
export class CustomerAuthController {
  constructor(private readonly auth: CustomerAuthService, private readonly wallet: WalletService) {}
  @Post("register") register(@Body() input: CustomerRegisterDto) { return this.auth.register(input); }
  @Post("business/register") registerBusiness(@Body() input: BusinessRegisterDto) { return this.auth.registerBusiness(input); }
  @Post("login") login(@Body() input: CustomerLoginDto) { return this.auth.login(input); }
  @Get("me") @UseGuards(JwtAuthGuard, CustomerAuthGuard) me(@Req() request: { user: AuthenticatedStaff }) { return this.auth.profile(request.user.sub); }

  @Get("card") @UseGuards(JwtAuthGuard, CustomerAuthGuard) card(@Req() request: { user: AuthenticatedStaff }) { return this.auth.card(request.user.sub); }
  @Get("notifications") @UseGuards(JwtAuthGuard, CustomerAuthGuard) notifications(@Req() request: { user: AuthenticatedStaff }) { return this.auth.notifications(request.user.sub); }
  @Patch("notifications/read-all") @UseGuards(JwtAuthGuard, CustomerAuthGuard) readNotifications(@Req() request: { user: AuthenticatedStaff }) { return this.auth.markNotificationsRead(request.user.sub); }

  @Get("vehicles") @UseGuards(JwtAuthGuard, CustomerAuthGuard) fleet(@Req() request: { user: AuthenticatedStaff }) { return this.auth.fleet(request.user.sub); }
  @Post("vehicles") @UseGuards(JwtAuthGuard, CustomerAuthGuard) addVehicle(@Body() input: FleetVehicleDto, @Req() request: { user: AuthenticatedStaff }) { return this.auth.addFleetVehicle(request.user.sub, input); }
  @Patch("vehicles/:id/deactivate") @UseGuards(JwtAuthGuard, CustomerAuthGuard) deactivateVehicle(@Param("id") id: string, @Req() request: { user: AuthenticatedStaff }) { return this.auth.deactivateFleetVehicle(request.user.sub, id); }

  @Get("business/manage") @UseGuards(JwtAuthGuard, RolesGuard) @Roles("ADMIN") listBusinesses() { return this.auth.listBusinessAccounts(); }
  @Patch("business/manage/:id/review") @UseGuards(JwtAuthGuard, RolesGuard) @Roles("ADMIN") reviewBusiness(@Param("id") id: string, @Body() input: BusinessReviewDto, @Req() request: { user: AuthenticatedStaff }) { return this.auth.reviewBusiness(id, input.decision, request.user.sub); }

  @Post("ratings") submitRating(@Body() input: CreateBookingRatingDto) { return this.auth.createRating(input); }
  @Get("ratings/manage") @UseGuards(JwtAuthGuard, RolesGuard) @Roles("ADMIN") ratingsSummary() { return this.auth.ratingsSummary(); }

  @Get("wallet") @UseGuards(JwtAuthGuard, CustomerAuthGuard)
  async getWallet(@Query() query: CustomerBookingQueryDto, @Req() request: { user: AuthenticatedStaff }) { return this.wallet.get(await this.auth.bookingIdentity(request.user.sub, query.code)); }
  @Post("wallet/loads") @UseGuards(JwtAuthGuard, CustomerAuthGuard)
  async load(@Body() input: CustomerWalletOperationDto, @Req() request: { user: AuthenticatedStaff }) { const identity = await this.auth.bookingIdentity(request.user.sub, input.code); return this.wallet.load({ ...identity, amountMzn: input.amountMzn ?? 500, method: input.method as "MOZA_DEMO" | "MPESA_DEMO" | "EMOLA_DEMO" | "PROMO_DEMO", idempotencyKey: input.idempotencyKey }); }
  @Post("wallet/payments") @UseGuards(JwtAuthGuard, CustomerAuthGuard)
  async pay(@Body() input: CustomerWalletOperationDto, @Req() request: { user: AuthenticatedStaff }) { const identity = await this.auth.bookingIdentity(request.user.sub, input.code); return this.wallet.pay({ ...identity, idempotencyKey: input.idempotencyKey }); }
  @Post("wallet/rewards/redeem") @UseGuards(JwtAuthGuard, CustomerAuthGuard)
  async redeem(@Body() input: CustomerWalletOperationDto, @Req() request: { user: AuthenticatedStaff }) { const identity = await this.auth.bookingIdentity(request.user.sub, input.code); return this.wallet.redeem({ ...identity, reward: input.reward ?? "WASH_DISCOUNT", idempotencyKey: input.idempotencyKey }); }
}
