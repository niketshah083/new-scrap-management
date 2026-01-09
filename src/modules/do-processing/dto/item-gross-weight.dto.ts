import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class ItemGrossWeightDto {
  @ApiProperty({ description: "Item ID to record gross weight for" })
  @IsNumber()
  itemId: number;

  @ApiProperty({
    description: "Gross weight at weighbridge-2 after loading this item",
    example: 7200,
  })
  @IsNumber()
  grossWeightWb2: number;

  @ApiProperty({ description: "Weighbridge-2 ID used", example: 2 })
  @IsNumber()
  @IsOptional()
  weighbridgeId?: number;

  @ApiProperty({ description: "Item remarks" })
  @IsString()
  @IsOptional()
  itemRemarks?: string;
}
