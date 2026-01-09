import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { FieldMappingDto } from "./field-mapping.dto";

export class UpdateExternalDbConfigDto {
  @ApiProperty({
    description: "Enable or disable external database integration",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  externalDbEnabled?: boolean;

  @ApiProperty({
    description: "External database host",
    example: "db.example.com",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalDbHost?: string;

  @ApiProperty({
    description: "External database port",
    example: 3306,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(65535)
  externalDbPort?: number;

  @ApiProperty({
    description: "External database name",
    example: "erp_database",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalDbName?: string;

  @ApiProperty({
    description: "External database username",
    example: "db_user",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalDbUsername?: string;

  @ApiProperty({
    description: "External database password",
    example: "secure_password",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalDbPassword?: string;

  @ApiProperty({
    description: "External database vendor table name",
    example: "vendors",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalDbVendorTable?: string;

  @ApiProperty({
    description: "External database purchase order table name",
    example: "purchase_orders",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalDbPoTable?: string;

  @ApiProperty({
    description: "External database material table name",
    example: "materials",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalDbMaterialTable?: string;

  @ApiProperty({
    description: "External database delivery order table name",
    example: "delivery_orders",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalDbDeliveryOrderTable?: string;

  @ApiProperty({
    description: "Cache TTL in seconds",
    example: 300,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(86400) // Max 24 hours
  externalDbCacheTtl?: number;

  @ApiProperty({
    description: "Field mappings for vendor entity",
    type: [FieldMappingDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  externalDbVendorMappings?: FieldMappingDto[];

  @ApiProperty({
    description: "Field mappings for purchase order entity",
    type: [FieldMappingDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  externalDbPoMappings?: FieldMappingDto[];

  @ApiProperty({
    description: "Field mappings for material entity",
    type: [FieldMappingDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  externalDbMaterialMappings?: FieldMappingDto[];

  @ApiProperty({
    description: "Field mappings for delivery order entity",
    type: [FieldMappingDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  externalDbDeliveryOrderMappings?: FieldMappingDto[];

  @ApiProperty({
    description: "External database delivery order item table name",
    example: "delivery_order_items",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalDbDeliveryOrderItemTable?: string;

  @ApiProperty({
    description: "Relation key for linking DO to items (e.g., doNumber or id)",
    example: "doNumber",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  externalDbDoItemRelationKey?: string;

  @ApiProperty({
    description: "Field mappings for delivery order item entity",
    type: [FieldMappingDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  externalDbDeliveryOrderItemMappings?: FieldMappingDto[];

  // Vendor Join Configuration for Delivery Orders
  @ApiProperty({
    description: "Vendor table name for DO join (e.g., acmast)",
    example: "acmast",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalDbDoVendorTable?: string;

  @ApiProperty({
    description: "Foreign key in DO table pointing to vendor (e.g., party)",
    example: "party",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  externalDbDoVendorFk?: string;

  @ApiProperty({
    description: "Primary key in vendor table (e.g., id)",
    example: "id",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  externalDbDoVendorPk?: string;

  @ApiProperty({
    description: "Vendor name field in vendor table (e.g., acname, name)",
    example: "acname",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  externalDbDoVendorNameField?: string;

  // Material Join Configuration for DO Items
  @ApiProperty({
    description: "Material table name for DO item join (e.g., item)",
    example: "item",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalDbDoItemMaterialTable?: string;

  @ApiProperty({
    description:
      "Foreign key in DO items table pointing to material (e.g., itemcode)",
    example: "itemcode",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  externalDbDoItemMaterialFk?: string;

  @ApiProperty({
    description: "Primary key in material table (e.g., itemcode)",
    example: "itemcode",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  externalDbDoItemMaterialPk?: string;

  @ApiProperty({
    description: "Material name field in material table (e.g., itemname)",
    example: "itemname",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  externalDbDoItemMaterialNameField?: string;

  // Transporter Configuration
  @ApiProperty({
    description: "External database transporter table name",
    example: "transporters",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalDbTransporterTable?: string;

  @ApiProperty({
    description: "Field mappings for transporter entity",
    type: [FieldMappingDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  externalDbTransporterMappings?: FieldMappingDto[];
}
