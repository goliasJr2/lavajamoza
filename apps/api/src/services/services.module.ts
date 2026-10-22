import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";

@Module({
  imports: [PassportModule],
  controllers: [ServicesController],
  providers: [ServicesService, JwtAuthGuard, RolesGuard],
})
export class ServicesModule {}
