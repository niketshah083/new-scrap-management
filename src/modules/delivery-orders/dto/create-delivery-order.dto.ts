import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateDeliveryOrderItemDto {
  @ApiProperty({ description: "Material ID" })
  @IsNumber()
  @IsNotEmpty()
  materialId: number;

  @ApiPropertyOptional({ description: "Weigh Bridge Net Weight" })
  @IsNumber()
  @IsOptional()
  wbNetWeight?: number;

  @ApiProperty({ description: "Quantity" })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ description: "Rate per unit" })
  @IsNumber()
  @IsNotEmpty()
  rate: number;
}

export class CreateDeliveryOrderDto {
  @ApiProperty({ description: "Delivery Order Number" })
  @IsString()
  @IsNotEmpty()
  doNumber: string;

  @ApiProperty({ description: "Vendor ID" })
  @IsNumber()
  @IsNotEmpty()
  vendorId: number;

  @ApiProperty({ description: "Delivery Order Date" })
  @IsDateString()
  @IsNotEmpty()
  doDate: string;

  @ApiPropertyOptional({ description: "Vehicle Number" })
  @IsString()
  @IsOptional()
  vehicleNo?: string;

  @ApiPropertyOptional({ description: "Gross Weight" })
  @IsNumber()
  @IsOptional()
  grossWeight?: number;

  @ApiPropertyOptional({ description: "Tare Weight" })
  @IsNumber()
  @IsOptional()
  tareWeight?: number;

  @ApiPropertyOptional({ description: "Net Weight" })
  @IsNumber()
  @IsOptional()
  netWeight?: number;

  @ApiPropertyOptional({ description: "Remarks" })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({
    description: "Delivery Order Items",
    type: [CreateDeliveryOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliveryOrderItemDto)
  items: CreateDeliveryOrderItemDto[];
}
