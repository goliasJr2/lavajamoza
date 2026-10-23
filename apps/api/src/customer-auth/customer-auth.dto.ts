import { IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength, Min, Max } from "class-validator";

export class CustomerRegisterDto {
  @IsString() @Matches(/^[A-Z0-9]{8}$/) code!: string;
  @IsString() @MaxLength(20) @Matches(/^(?:\+?258[\s-]?)?8[2-7](?:[\s-]?\d){7}$/) phone!: string;
  @IsString() @MinLength(12) @MaxLength(100) password!: string;
}

export class CustomerLoginDto {
  @IsString() @MaxLength(20) @Matches(/^(?:\+?258[\s-]?)?8[2-7](?:[\s-]?\d){7}$/) phone!: string;
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
  @IsString() @MaxLength(20) @Matches(/^(?:\+?258[\s-]?)?8[2-7](?:[\s-]?\d){7}$/) phone!: string;
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
