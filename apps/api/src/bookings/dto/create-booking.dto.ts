import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength, Matches } from "class-validator";

export class CreateBookingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(20)
  @Matches(/^(?:\+?258[\s-]?)?8[2-7](?:[\s-]?\d){7}$/, {
    message: "Indique um número moçambicano válido, por exemplo 84 123 4567.",
  })
  phone!: string;

  @IsString()
  @MaxLength(12)
  @Matches(/^[A-Za-z0-9 -]{5,12}$/, {
    message: "Verifique a matrícula da viatura.",
  })
  plate!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{8,32}$/)
  serviceId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ArrayUnique()
  @IsString({ each: true })
  serviceIds?: string[];

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  time!: string;
}

export class FindBookingDto {
  @IsString()
  @Matches(/^[A-Z0-9]{8}$/)
  code!: string;

  @IsString()
  @MaxLength(20)
  @Matches(/^(?:\+?258[\s-]?)?8[2-7](?:[\s-]?\d){7}$/)
  phone!: string;
}

export class UpdateBookingStatusDto {
  @IsIn(["ACCEPTED", "REJECTED"])
  status!: "ACCEPTED" | "REJECTED";
}

export class BookingAvailabilityDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{8,32}$/)
  serviceId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{8,32}(,[a-zA-Z0-9_-]{8,32}){0,5}$/)
  serviceIds?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
}
