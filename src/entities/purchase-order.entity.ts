import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { Vendor } from "./vendor.entity";
import { User } from "./user.entity";

// PO Status flow: draft -> pending_approval -> approved/rejected -> partial/completed/cancelled
export enum POStatus {
  DRAFT = "draft",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  REJECTED = "rejected",
  PARTIAL = "partial",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity("purchase_orders")
export class PurchaseOrder extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "po_number", length: 50, unique: true })
  poNumber: string;

  @Column({ name: "vendor_id" })
  vendorId: number;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: "vendor_id" })
  vendor: Vendor;

  @Column({ name: "expected_delivery_date", type: "date" })
  expectedDeliveryDate: Date;

  @Column({ length: 20, default: POStatus.DRAFT })
  status: string; // draft, pending_approval, approved, rejected, partial, completed, cancelled

  @Column("text", { nullable: true })
  notes: string;

  // Approval fields
  @Column({ name: "approved_by", nullable: true })
  approvedBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "approved_by" })
  approver: User;

  @Column({ name: "approved_at", type: "timestamp", nullable: true })
  approvedAt: Date;

  @Column({ name: "rejection_reason", type: "text", nullable: true })
  rejectionReason: string;

  @OneToMany("PurchaseOrderItem", "purchaseOrder", { cascade: true })
  items: import("./purchase-order-item.entity").PurchaseOrderItem[];
}
