import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  priceMzn?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  durationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
