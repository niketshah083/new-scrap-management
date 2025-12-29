import { ApiProperty } from "@nestjs/swagger";
import { FieldMappingDto } from "./field-mapping.dto";

export class ExternalDbConfigResponseDto {
  @ApiProperty({
    description: "Whether external database integration is enabled",
    example: true,
  })
  externalDbEnabled: boolean;

  @ApiProperty({
    description: "External database host",
    example: "db.example.com",
    nullable: true,
  })
  externalDbHost: string | null;

  @ApiProperty({
    description: "External database port",
    example: 3306,
    nullable: true,
  })
  externalDbPort: number | null;

  @ApiProperty({
    description: "External database name",
    example: "erp_database",
    nullable: true,
  })
  externalDbName: string | null;

  @ApiProperty({
    description: "External database username",
    example: "db_user",
    nullable: true,
  })
  externalDbUsername: string | null;

  // Note: Password is intentionally excluded for security

  @ApiProperty({
    description: "External database vendor table name",
    example: "vendors",
    nullable: true,
  })
  externalDbVendorTable: string | null;

  @ApiProperty({
    description: "External database purchase order table name",
    example: "purchase_orders",
    nullable: true,
  })
  externalDbPoTable: string | null;

  @ApiProperty({
    description: "External database material table name",
    example: "materials",
    nullable: true,
  })
  externalDbMaterialTable: string | null;

  @ApiProperty({
    description: "Cache TTL in seconds",
    example: 300,
    nullable: true,
  })
  externalDbCacheTtl: number | null;

  @ApiProperty({
    description: "Field mappings for vendor entity",
    type: [FieldMappingDto],
    nullable: true,
  })
  externalDbVendorMappings: FieldMappingDto[] | null;

  @ApiProperty({
    description: "Field mappings for purchase order entity",
    type: [FieldMappingDto],
    nullable: true,
  })
  externalDbPoMappings: FieldMappingDto[] | null;

  @ApiProperty({
    description: "Field mappings for material entity",
    type: [FieldMappingDto],
    nullable: true,
  })
  externalDbMaterialMappings: FieldMappingDto[] | null;

  @ApiProperty({
    description:
      "Whether password is configured (without revealing the actual password)",
    example: true,
  })
  hasPassword: boolean;
}
