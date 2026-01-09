import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class ItemTareWeightDto {
  @ApiProperty({ description: "Item ID to record tare weight for" })
  @IsNumber()
  itemId: number;

  @ApiProperty({
    description: "Tare weight at weighbridge-2 before loading this item",
    example: 5200,
  })
  @IsNumber()
  tareWeightWb2: number;

  @ApiProperty({ description: "Weighbridge-2 ID used", example: 2 })
  @IsNumber()
  @IsOptional()
  weighbridgeId?: number;
}
