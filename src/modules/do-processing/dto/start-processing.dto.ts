import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";

export class DoItemDto {
  @ApiProperty({ description: "External item ID" })
  @IsString()
  @IsOptional()
  externalItemId?: string;

  @ApiProperty({ description: "Material ID" })
  @IsString()
  @IsOptional()
  materialId?: string;

  @ApiProperty({ description: "Material name" })
  @IsString()
  @IsOptional()
  materialName?: string;

  @ApiProperty({ description: "Material code" })
  @IsString()
  @IsOptional()
  materialCode?: string;

  @ApiProperty({ description: "Ordered quantity" })
  @IsNumber()
  @IsOptional()
  orderedQuantity?: number;

  @ApiProperty({ description: "Ordered rate" })
  @IsNumber()
  @IsOptional()
  orderedRate?: number;
}

export class StartDoProcessingDto {
  @ApiProperty({ description: "External DO ID", example: "123" })
  @IsString()
  @IsOptional()
  externalDoId?: string;

  @ApiProperty({ description: "DO Number", example: "DO-2024-001" })
  @IsString()
  @MaxLength(100)
  doNumber: string;

  @ApiProperty({ description: "DO Date" })
  @IsString()
  @IsOptional()
  doDate?: string;

  @ApiProperty({ description: "Vendor ID" })
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiProperty({ description: "Vendor name" })
  @IsString()
  @IsOptional()
  vendorName?: string;

  @ApiProperty({ description: "Vehicle number" })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  vehicleNo?: string;

  @ApiProperty({ description: "Driver name" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  driverName?: string;

  @ApiProperty({ description: "Driver phone" })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  driverPhone?: string;

  @ApiProperty({ description: "Items from DO", type: [DoItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DoItemDto)
  items: DoItemDto[];

  @ApiProperty({ description: "Remarks" })
  @IsString()
  @IsOptional()
  remarks?: string;
}
