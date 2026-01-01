import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { PurchaseOrder } from "./purchase-order.entity";
import { Vendor } from "./vendor.entity";

@Entity("grns")
export class GRN extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "grn_number", length: 50, unique: true })
  grnNumber: string;

  @Column({ name: "purchase_order_id", nullable: true })
  purchaseOrderId: number;

  @ManyToOne(() => PurchaseOrder, { nullable: true })
  @JoinColumn({ name: "purchase_order_id" })
  purchaseOrder: PurchaseOrder;

  // External PO reference (used when external DB is enabled)
  @Column({ name: "external_po_id", length: 100, nullable: true })
  externalPoId: string;

  @Column({ name: "vendor_id", nullable: true })
  vendorId: number;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: "vendor_id" })
  vendor: Vendor;

  // External Vendor reference (used when external DB is enabled)
  @Column({ name: "external_vendor_id", length: 100, nullable: true })
  externalVendorId: string;

  // Flag to indicate if this GRN uses external data sources
  @Column({ name: "uses_external_db", default: false })
  usesExternalDb: boolean;

  @Column({ name: "current_step", type: "tinyint", default: 1 })
  currentStep: number; // 1-7

  @Column({ length: 20, default: "in_progress" })
  status: string; // in_progress, completed, rejected

  // ============================================
  // STATIC FIELDS (not configurable per tenant)
  // ============================================

  // Step 1 - Gate Entry (static field)
  @Column({ name: "truck_number", length: 50, nullable: true })
  truckNumber: string;

  // Step 5 - Supervisor Review (static fields)
  @Column({ name: "verification_status", length: 20, nullable: true })
  verificationStatus: string; // verified, not_verified

  @Column({ name: "approval_status", length: 20, nullable: true })
  approvalStatus: string; // approved, rejected

  @Column("text", { name: "rejection_reason", nullable: true })
  rejectionReason: string;

  @Column({ name: "reviewed_by", nullable: true })
  reviewedBy: number;

  @Column({ name: "reviewed_at", type: "datetime", nullable: true })
  reviewedAt: Date;

  // Step 4 - Net Weight (static field, auto-calculated from gross_weight - tare_weight)
  @Column("decimal", {
    name: "net_weight",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  netWeight: number;

  // ============================================
  // DYNAMIC FIELDS are stored in GRNFieldValue
  // Step 2: gross_weight, gross_weight_image
  // Step 3: driver_photo, driver_licence_image, unloading_photos, unloading_notes, material_count
  // Step 4: tare_weight, tare_weight_image, net_weight
  // ============================================

  // Relations
  @OneToMany("GRNFieldValue", "grn", { cascade: true })
  fieldValues: import("./grn-field-value.entity").GRNFieldValue[];
}
