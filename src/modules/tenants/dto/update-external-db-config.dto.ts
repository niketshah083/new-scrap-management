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
}
