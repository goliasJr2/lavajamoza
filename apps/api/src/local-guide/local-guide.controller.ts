import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateLocalPlaceDto } from "./dto/create-local-place.dto";
import { UpdateLocalPlaceDto } from "./dto/update-local-place.dto";
import { LocalGuideService } from "./local-guide.service";

@Controller("local-guide")
export class LocalGuideController {
  constructor(private readonly localGuide: LocalGuideService) {}

  @Get()
  findAll() {
    return this.localGuide.findAll();
  }

  @Get("manage")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  listForManagement() {
    return this.localGuide.listForManagement();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  create(@Body() input: CreateLocalPlaceDto) {
    return this.localGuide.create(input);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() input: UpdateLocalPlaceDto) {
    return this.localGuide.update(id, input);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.localGuide.remove(id);
  }
}
