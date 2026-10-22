import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { LocalGuideController } from "./local-guide.controller";
import { LocalGuideService } from "./local-guide.service";

@Module({ imports: [PrismaModule], controllers: [LocalGuideController], providers: [LocalGuideService] })
export class LocalGuideModule {}
