import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { WalletModule } from "../wallet/wallet.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { CustomerAuthController } from "./customer-auth.controller";
import { CustomerAuthGuard } from "./customer-auth.guard";
import { CustomerAuthService } from "./customer-auth.service";

@Module({ imports: [PrismaModule, AuthModule, WalletModule, NotificationsModule], controllers: [CustomerAuthController], providers: [CustomerAuthService, CustomerAuthGuard] })
export class CustomerAuthModule {}
