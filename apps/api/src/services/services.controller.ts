import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServicesService } from "./services.service";

@Controller("services")
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  listPublic() {
    return this.services.listActive();
  }

  @Get("manage")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  listForManagement() {
    return this.services.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  create(@Body() input: CreateServiceDto) {
    return this.services.create(input);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  update(
    @Param("id") id: string,
    @Body() input: UpdateServiceDto,
  ) {
    return this.services.update(id, input);
  }
}
