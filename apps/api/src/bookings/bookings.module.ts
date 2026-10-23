import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { WalletModule } from "../wallet/wallet.module";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
