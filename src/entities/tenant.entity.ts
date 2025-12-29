import { Entity, Column } from "typeorm";
import { BaseEntity } from "./base.entity";

/**
 * Field mapping configuration for external database integration
 */
export interface FieldMapping {
  internalField: string;
  externalField: string;
  transform?: "string" | "number" | "date" | "boolean";
}

@Entity("tenants")
export class Tenant extends BaseEntity {
  @Column({ name: "company_name", length: 255 })
  companyName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 20 })
  phone: string;

  @Column("text", { nullable: true })
  address: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  // External Database Configuration Fields
  @Column({ name: "external_db_enabled", default: false })
  externalDbEnabled: boolean;

  @Column({ name: "external_db_host", length: 255, nullable: true })
  externalDbHost: string;

  @Column({ name: "external_db_port", default: 3306, nullable: true })
  externalDbPort: number;

  @Column({ name: "external_db_name", length: 255, nullable: true })
  externalDbName: string;

  @Column({ name: "external_db_username", length: 255, nullable: true })
  externalDbUsername: string;

  @Column({ name: "external_db_password", length: 500, nullable: true })
  externalDbPassword: string; // Encrypted with AES-256

  // External Database Table Configuration
  @Column({
    name: "external_db_vendor_table",
    length: 255,
    default: "vendors",
    nullable: true,
  })
  externalDbVendorTable: string;

  @Column({
    name: "external_db_po_table",
    length: 255,
    default: "purchase_orders",
    nullable: true,
  })
  externalDbPoTable: string;

  @Column({
    name: "external_db_material_table",
    length: 255,
    default: "materials",
    nullable: true,
  })
  externalDbMaterialTable: string;

  @Column({ name: "external_db_cache_ttl", default: 300, nullable: true })
  externalDbCacheTtl: number; // Cache TTL in seconds (default 5 minutes)

  // Field Mappings (JSON columns)
  @Column("json", { name: "external_db_vendor_mappings", nullable: true })
  externalDbVendorMappings: FieldMapping[];

  @Column("json", { name: "external_db_po_mappings", nullable: true })
  externalDbPoMappings: FieldMapping[];

  @Column("json", { name: "external_db_material_mappings", nullable: true })
  externalDbMaterialMappings: FieldMapping[];
}
