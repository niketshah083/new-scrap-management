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

  @Column({
    name: "external_db_delivery_order_table",
    length: 255,
    default: "delivery_orders",
    nullable: true,
  })
  externalDbDeliveryOrderTable: string;

  @Column({ name: "external_db_cache_ttl", default: 300, nullable: true })
  externalDbCacheTtl: number; // Cache TTL in seconds (default 5 minutes)

  // Field Mappings (JSON columns)
  @Column("json", { name: "external_db_vendor_mappings", nullable: true })
  externalDbVendorMappings: FieldMapping[];

  @Column("json", { name: "external_db_po_mappings", nullable: true })
  externalDbPoMappings: FieldMapping[];

  @Column("json", { name: "external_db_material_mappings", nullable: true })
  externalDbMaterialMappings: FieldMapping[];

  @Column("json", {
    name: "external_db_delivery_order_mappings",
    nullable: true,
  })
  externalDbDeliveryOrderMappings: FieldMapping[];

  // Delivery Order Item Configuration
  @Column({
    name: "external_db_delivery_order_item_table",
    length: 255,
    default: "delivery_order_items",
    nullable: true,
  })
  externalDbDeliveryOrderItemTable: string;

  @Column({
    name: "external_db_do_item_relation_key",
    length: 100,
    default: "doNumber",
    nullable: true,
  })
  externalDbDoItemRelationKey: string; // Which DO field to use for joining items (e.g., 'doNumber' or 'id')

  @Column("json", {
    name: "external_db_delivery_order_item_mappings",
    nullable: true,
  })
  externalDbDeliveryOrderItemMappings: FieldMapping[];

  // Vendor Join Configuration for Delivery Orders
  @Column({
    name: "external_db_do_vendor_table",
    length: 255,
    nullable: true,
  })
  externalDbDoVendorTable: string; // e.g., 'acmast'

  @Column({
    name: "external_db_do_vendor_fk",
    length: 100,
    nullable: true,
  })
  externalDbDoVendorFk: string; // Foreign key in DO table, e.g., 'party'

  @Column({
    name: "external_db_do_vendor_pk",
    length: 100,
    default: "id",
    nullable: true,
  })
  externalDbDoVendorPk: string; // Primary key in vendor table, e.g., 'id'

  @Column({
    name: "external_db_do_vendor_name_field",
    length: 100,
    nullable: true,
  })
  externalDbDoVendorNameField: string; // Vendor name field, e.g., 'acname' or 'name'

  // Material Join Configuration for DO Items
  @Column({
    name: "external_db_do_item_material_table",
    length: 255,
    nullable: true,
  })
  externalDbDoItemMaterialTable: string; // e.g., 'item'

  @Column({
    name: "external_db_do_item_material_fk",
    length: 100,
    nullable: true,
  })
  externalDbDoItemMaterialFk: string; // Foreign key in items table, e.g., 'itemcode'

  @Column({
    name: "external_db_do_item_material_pk",
    length: 100,
    default: "itemcode",
    nullable: true,
  })
  externalDbDoItemMaterialPk: string; // Primary key in material table, e.g., 'itemcode'

  @Column({
    name: "external_db_do_item_material_name_field",
    length: 100,
    nullable: true,
  })
  externalDbDoItemMaterialNameField: string; // Material name field, e.g., 'itemname'

  // Transporter Configuration
  @Column({
    name: "external_db_transporter_table",
    length: 255,
    default: "transporters",
    nullable: true,
  })
  externalDbTransporterTable: string;

  @Column("json", { name: "external_db_transporter_mappings", nullable: true })
  externalDbTransporterMappings: FieldMapping[];
}
