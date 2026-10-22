import { IsString, Matches, MaxLength } from "class-validator";

export class NotificationIdentityDto {
  @IsString()
  @Matches(/^[A-Z0-9]{8}$/)
  code!: string;

  @IsString()
  @MaxLength(20)
  @Matches(/^(?:\+?258[\s-]?)?8[2-7](?:[\s-]?\d){7}$/)
  phone!: string;
}
