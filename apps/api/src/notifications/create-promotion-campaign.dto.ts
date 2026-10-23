import { IsDateString, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreatePromotionCampaignDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  message!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Matches(/^\/(?!\/)[A-Za-z0-9/_?&=%#.-]*$/)
  actionUrl?: string | null;
}
