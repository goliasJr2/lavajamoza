import { IsInt, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateServiceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  description!: string;

  @IsInt()
  @Min(1)
  priceMzn!: number;

  @IsInt()
  @Min(5)
  durationMinutes!: number;
}
