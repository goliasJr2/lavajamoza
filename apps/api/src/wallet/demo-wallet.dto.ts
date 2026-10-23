import { IsIn, IsInt, IsString, Matches, Max, MaxLength, Min } from "class-validator";

export class WalletIdentityDto {
  @IsString()
  @Matches(/^[A-Z0-9]{8}$/)
  code!: string;

  @IsString()
  @MaxLength(20)
  @Matches(/^(?:\+?258[\s-]?)?8[2-7](?:[\s-]?\d){7}$/)
  phone!: string;
}

export class LoadDemoWalletDto extends WalletIdentityDto {
  @IsInt() @Min(100) @Max(50000)
  amountMzn!: number;

  @IsIn(["MOZA_DEMO", "MPESA_DEMO", "EMOLA_DEMO", "PROMO_DEMO"])
  method!: "MOZA_DEMO" | "MPESA_DEMO" | "EMOLA_DEMO" | "PROMO_DEMO";

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{12,80}$/)
  idempotencyKey!: string;
}

export class PayDemoWalletDto extends WalletIdentityDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{12,80}$/)
  idempotencyKey!: string;
}

export class RedeemDemoPointsDto extends WalletIdentityDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{12,80}$/)
  idempotencyKey!: string;

  @IsIn(["WASH_DISCOUNT"])
  reward!: "WASH_DISCOUNT";
}
