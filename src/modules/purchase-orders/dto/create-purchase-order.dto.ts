import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePurchaseOrderItemDto {
  @ApiProperty({ description: "Material ID", example: 1 })
  @IsNumber()
  @IsNotEmpty()
  materialId: number;

  @ApiProperty({ description: "Quantity", example: 100.5 })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ description: "Unit price", example: 25.0 })
  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: "Purchase order number", example: "PO-2024-001" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  poNumber: string;

  @ApiProperty({ description: "Vendor ID", example: 1 })
  @IsNumber()
  @IsNotEmpty()
  vendorId: number;

  @ApiProperty({ description: "Expected delivery date", example: "2024-12-31" })
  @IsDateString()
  @IsNotEmpty()
  expectedDeliveryDate: string;

  @ApiProperty({
    description: "Notes",
    example: "Urgent delivery required",
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: "Purchase order items",
    type: [CreatePurchaseOrderItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}
