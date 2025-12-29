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

  @Column({ name: "vendor_id" })
  vendorId: number;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: "vendor_id" })
  vendor: Vendor;

  @Column({ name: "current_step", type: "tinyint", default: 1 })
  currentStep: number; // 1-7

  @Column({ length: 20, default: "in_progress" })
  status: string; // in_progress, completed, rejected

  // Step 1 - Gate Entry fields
  @Column({ name: "truck_number", length: 50, nullable: true })
  truckNumber: string;

  /**
   * @deprecated Use dynamic field values (GRNFieldValue) with fieldName="driver_name" instead.
   * This column is kept for backward compatibility but is no longer populated.
   */
  @Column({ name: "driver_name", length: 255, nullable: true })
  driverName: string;

  /**
   * @deprecated Use dynamic field values (GRNFieldValue) with fieldName="driver_mobile" instead.
   * This column is kept for backward compatibility but is no longer populated.
   */
  @Column({ name: "driver_mobile", length: 20, nullable: true })
  driverMobile: string;

  /**
   * @deprecated Use dynamic field values (GRNFieldValue) with fieldName="driver_licence" instead.
   * This column is kept for backward compatibility but is no longer populated.
   */
  @Column({ name: "driver_licence", length: 100, nullable: true })
  driverLicence: string;

  // Step 2 - Initial Weighing fields
  @Column("decimal", {
    name: "gross_weight",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  grossWeight: number;

  @Column({ name: "gross_weight_image", length: 500, nullable: true })
  grossWeightImage: string;

  // Step 3 - Unloading fields
  @Column({ name: "driver_photo", length: 500, nullable: true })
  driverPhoto: string;

  @Column({ name: "driver_licence_image", length: 500, nullable: true })
  driverLicenceImage: string;

  @Column("json", { name: "unloading_photos", nullable: true })
  unloadingPhotos: string[];

  @Column("text", { name: "unloading_notes", nullable: true })
  unloadingNotes: string;

  // Step 4 - Final Weighing fields
  @Column("decimal", {
    name: "tare_weight",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  tareWeight: number;

  @Column({ name: "tare_weight_image", length: 500, nullable: true })
  tareWeightImage: string;

  @Column("decimal", {
    name: "net_weight",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  netWeight: number;

  @Column({ name: "material_count", nullable: true })
  materialCount: number;

  // Step 5 - Supervisor Review fields
  @Column({ name: "verification_status", length: 20, nullable: true })
  verificationStatus: string; // verified, not_verified

  @Column({ name: "approval_status", length: 20, nullable: true })
  approvalStatus: string; // approved, rejected

  @Column("text", { name: "review_notes", nullable: true })
  reviewNotes: string;

  @Column("text", { name: "rejection_reason", nullable: true })
  rejectionReason: string;

  @Column({ name: "reviewed_by", nullable: true })
  reviewedBy: number;

  @Column({ name: "reviewed_at", type: "datetime", nullable: true })
  reviewedAt: Date;

  // Relations
  @OneToMany("GRNFieldValue", "grn", { cascade: true })
  fieldValues: import("./grn-field-value.entity").GRNFieldValue[];
}
