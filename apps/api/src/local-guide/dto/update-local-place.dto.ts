import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from "class-validator";
import { LocalPlaceCategory } from "@prisma/client";

export class UpdateLocalPlaceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(LocalPlaceCategory)
  category?: LocalPlaceCategory;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(240)
  estimatedMinutes?: number;

  @IsOptional()
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(500)
  externalUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
