import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { ServicesModule } from "./services/services.module";
import { BookingsModule } from "./bookings/bookings.module";
import { WalletModule } from "./wallet/wallet.module";
import { LocalGuideModule } from "./local-guide/local-guide.module";
import { NotificationsModule } from "./notifications/notifications.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    PrismaModule,
    AuthModule,
    ServicesModule,
    BookingsModule,
    WalletModule,
    LocalGuideModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
