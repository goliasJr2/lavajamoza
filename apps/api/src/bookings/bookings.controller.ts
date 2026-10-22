import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { BookingsService } from "./bookings.service";
import { BookingAvailabilityDto, CreateBookingDto, FindBookingDto, UpdateBookingStatusDto } from "./dto/create-booking.dto";
import { IsIn } from "class-validator";

class UpdateOperationalStatusDto {
  @IsIn(["IN_PROGRESS", "COMPLETED"])
  status!: "IN_PROGRESS" | "COMPLETED";
}

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  create(@Body() input: CreateBookingDto) {
    return this.bookings.create(input);
  }

  @Get("availability")
  availability(@Query() query: BookingAvailabilityDto) {
    return this.bookings.availability(query);
  }

  @Get("mine")
  findForCustomer(@Query() query: FindBookingDto) {
    return this.bookings.findForCustomer(query.code, query.phone);
  }

  @Get("history")
  findCustomerHistory(@Query() query: FindBookingDto) {
    return this.bookings.findCustomerHistory(query.code, query.phone);
  }

  @Get("manage")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  listForManagement() {
    return this.bookings.listForManagement();
  }

  @Get("manage/summary")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  managementSummary() {
    return this.bookings.managementSummary();
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  updateStatus(@Param("id") id: string, @Body() input: UpdateBookingStatusDto) {
    return this.bookings.updateRequestStatus(id, input.status);
  }

  @Patch(":id/operational-status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  updateOperationalStatus(@Param("id") id: string, @Body() input: UpdateOperationalStatusDto) {
    return this.bookings.updateOperationalStatus(id, input.status);
  }
}
