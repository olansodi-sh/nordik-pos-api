import { IsNumber, IsUUID, Min } from 'class-validator';

export class AddKitComponentDto {
  @IsUUID()
  componentProductId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
}
