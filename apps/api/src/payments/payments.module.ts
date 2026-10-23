import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { WalletModule } from "../wallet/wallet.module";
import { MozaDemoPaymentsController, PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({ imports: [PrismaModule, WalletModule], controllers: [PaymentsController, MozaDemoPaymentsController], providers: [PaymentsService] })
export class PaymentsModule {}
