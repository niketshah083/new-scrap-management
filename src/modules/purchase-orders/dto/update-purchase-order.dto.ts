import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  MaxLength,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";

export enum PurchaseOrderStatus {
  PENDING = "pending",
  PARTIAL = "partial",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export class UpdatePurchaseOrderItemDto {
  @ApiProperty({
    description: "Item ID (for existing items)",
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ description: "Material ID", example: 1 })
  @IsNumber()
  materialId: number;

  @ApiProperty({ description: "Quantity", example: 100.5 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: "Unit price", example: 25.0 })
  @IsNumber()
  unitPrice: number;
}

export class UpdatePurchaseOrderDto {
  @ApiProperty({
    description: "Purchase order number",
    example: "PO-2024-001",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  poNumber?: string;

  @ApiProperty({ description: "Vendor ID", example: 1, required: false })
  @IsNumber()
  @IsOptional()
  vendorId?: number;

  @ApiProperty({
    description: "Expected delivery date",
    example: "2024-12-31",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @ApiProperty({
    description: "Status",
    enum: PurchaseOrderStatus,
    example: "pending",
    required: false,
  })
  @IsEnum(PurchaseOrderStatus)
  @IsOptional()
  status?: PurchaseOrderStatus;

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
    type: [UpdatePurchaseOrderItemDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseOrderItemDto)
  @IsOptional()
  items?: UpdatePurchaseOrderItemDto[];
}
