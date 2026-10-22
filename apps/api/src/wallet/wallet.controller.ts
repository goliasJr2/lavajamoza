import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { LoadDemoWalletDto, PayDemoWalletDto, RedeemDemoPointsDto, WalletIdentityDto } from "./demo-wallet.dto";
import { WalletService } from "./wallet.service";

@Controller("demo-wallet")
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  get(@Query() query: WalletIdentityDto) {
    return this.wallet.get(query);
  }

  @Get("manage/summary")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  managementSummary() {
    return this.wallet.managementSummary();
  }

  @Post("loads")
  load(@Body() input: LoadDemoWalletDto) {
    return this.wallet.load(input);
  }

  @Post("payments")
  pay(@Body() input: PayDemoWalletDto) {
    return this.wallet.pay(input);
  }

  @Post("rewards/redeem")
  redeem(@Body() input: RedeemDemoPointsDto) {
    return this.wallet.redeem(input);
  }
}
