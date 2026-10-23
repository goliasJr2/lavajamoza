import { IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength, Min, Max } from "class-validator";
import { Transform } from "class-transformer";

function normalizeMozambicanPhone(value: unknown) {
  if (typeof value !== "string") return value;
  let phone = value.replace(/[\s()-]/g, "");
  if (phone.startsWith("+")) phone = phone.slice(1);
  if (phone.startsWith("00")) phone = phone.slice(2);
  if (phone.startsWith("258")) phone = phone.slice(3);
  return phone;
}

export class CustomerRegisterDto {
  @IsString() @Matches(/^[A-Z0-9]{8}$/) code!: string;
  @Transform(({ value }) => normalizeMozambicanPhone(value))
  @IsString() @MaxLength(20) @Matches(/^8[2-7]\d{7}$/, { message: "Use um telefone moçambicano com 9 dígitos, por exemplo 841234567 ou +258 84 123 4567." }) phone!: string;
  @IsString() @MinLength(12) @MaxLength(100) password!: string;
}

export class CustomerLoginDto {
  @Transform(({ value }) => normalizeMozambicanPhone(value))
  @IsString() @MaxLength(20) @Matches(/^8[2-7]\d{7}$/, { message: "Use um telefone moçambicano com 9 dígitos, por exemplo 841234567 ou +258 84 123 4567." }) phone!: string;
  @IsString() @MinLength(12) @MaxLength(100) password!: string;
}

export class CustomerBookingQueryDto {
  @IsString() @Matches(/^[A-Z0-9]{8}$/) code!: string;
}

export class CustomerWalletOperationDto {
  @IsString() @Matches(/^[A-Z0-9]{8}$/) code!: string;
  @IsString() @Matches(/^[A-Za-z0-9_-]{12,80}$/) idempotencyKey!: string;
  @IsOptional() @IsString() @Matches(/^(MOZA_DEMO|MPESA_DEMO|EMOLA_DEMO|PROMO_DEMO)$/) method?: string;
  @IsOptional() @IsString() @Matches(/^WASH_DISCOUNT$/) reward?: "WASH_DISCOUNT";
}

export class BusinessRegisterDto {
  @IsString() @MinLength(2) @MaxLength(120) businessName!: string;
  @IsString() @Matches(/^\d{9}$/) nuit!: string;
  @IsString() @MinLength(2) @MaxLength(100) contactName!: string;
  @Transform(({ value }) => normalizeMozambicanPhone(value))
  @IsString() @MaxLength(20) @Matches(/^8[2-7]\d{7}$/, { message: "Use um telefone moçambicano com 9 dígitos, por exemplo 841234567 ou +258 84 123 4567." }) phone!: string;
  @IsString() @MinLength(12) @MaxLength(100) password!: string;
}

export class FleetVehicleDto {
  @IsString() @MinLength(5) @MaxLength(12) @Matches(/^[A-Za-z0-9 -]+$/) plate!: string;
}

export class BusinessReviewDto {
  @IsString() @IsIn(["APPROVE", "REJECT"]) decision!: "APPROVE" | "REJECT";
}

export class CreateBookingRatingDto {
  @IsString() @Matches(/^[A-Z0-9]{8}$/) code!: string;
  @IsString() @MaxLength(20) @Matches(/^(?:\+?258[\s-]?)?8[2-7](?:[\s-]?\d){7}$/) phone!: string;
  @IsInt() @Min(1) @Max(5) score!: number;
  @IsOptional() @IsString() @MaxLength(1000) comment?: string;
}
