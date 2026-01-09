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
    description: "External database delivery order table name",
    example: "delivery_orders",
    nullable: true,
  })
  externalDbDeliveryOrderTable: string | null;

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
    description: "Field mappings for delivery order entity",
    type: [FieldMappingDto],
    nullable: true,
  })
  externalDbDeliveryOrderMappings: FieldMappingDto[] | null;

  @ApiProperty({
    description: "External database delivery order item table name",
    example: "delivery_order_items",
    nullable: true,
  })
  externalDbDeliveryOrderItemTable: string | null;

  @ApiProperty({
    description: "Relation key for linking DO to items (e.g., doNumber or id)",
    example: "doNumber",
    nullable: true,
  })
  externalDbDoItemRelationKey: string | null;

  @ApiProperty({
    description: "Field mappings for delivery order item entity",
    type: [FieldMappingDto],
    nullable: true,
  })
  externalDbDeliveryOrderItemMappings: FieldMappingDto[] | null;

  // Vendor Join Configuration for Delivery Orders
  @ApiProperty({
    description: "Vendor table name for DO join (e.g., acmast)",
    example: "acmast",
    nullable: true,
  })
  externalDbDoVendorTable: string | null;

  @ApiProperty({
    description: "Foreign key in DO table pointing to vendor (e.g., party)",
    example: "party",
    nullable: true,
  })
  externalDbDoVendorFk: string | null;

  @ApiProperty({
    description: "Primary key in vendor table (e.g., id)",
    example: "id",
    nullable: true,
  })
  externalDbDoVendorPk: string | null;

  @ApiProperty({
    description: "Vendor name field in vendor table (e.g., acname, name)",
    example: "acname",
    nullable: true,
  })
  externalDbDoVendorNameField: string | null;

  // Material Join Configuration for DO Items
  @ApiProperty({
    description: "Material table name for DO item join (e.g., item)",
    example: "item",
    nullable: true,
  })
  externalDbDoItemMaterialTable: string | null;

  @ApiProperty({
    description:
      "Foreign key in DO items table pointing to material (e.g., itemcode)",
    example: "itemcode",
    nullable: true,
  })
  externalDbDoItemMaterialFk: string | null;

  @ApiProperty({
    description: "Primary key in material table (e.g., itemcode)",
    example: "itemcode",
    nullable: true,
  })
  externalDbDoItemMaterialPk: string | null;

  @ApiProperty({
    description: "Material name field in material table (e.g., itemname)",
    example: "itemname",
    nullable: true,
  })
  externalDbDoItemMaterialNameField: string | null;

  // Transporter Configuration
  @ApiProperty({
    description: "External database transporter table name",
    example: "transporters",
    nullable: true,
  })
  externalDbTransporterTable: string | null;

  @ApiProperty({
    description: "Field mappings for transporter entity",
    type: [FieldMappingDto],
    nullable: true,
  })
  externalDbTransporterMappings: FieldMappingDto[] | null;

  @ApiProperty({
    description:
      "Whether password is configured (without revealing the actual password)",
    example: true,
  })
  hasPassword: boolean;
}
