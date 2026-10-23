import { IsIn, IsString, Matches, MaxLength } from "class-validator";

export class CreateRecordedPaymentDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{8,32}$/)
  bookingId!: string;

  @IsIn(["CASH", "OTHER"])
  method!: "CASH" | "OTHER";
}

export class MozaDemoRequestDto {
  @IsString() @Matches(/^[A-Z0-9]{8}$/) code!: string;
  @IsString() @MaxLength(20) @Matches(/^(?:\+?258[\s-]?)?8[2-7](?:[\s-]?\d){7}$/) phone!: string;
}
