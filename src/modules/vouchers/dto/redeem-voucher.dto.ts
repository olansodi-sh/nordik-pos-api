import { IsNumber, Min } from 'class-validator';

export class RedeemVoucherDto {
  @IsNumber()
  @Min(0.01)
  amount: number;
}
