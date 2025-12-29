import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { Vendor } from "./vendor.entity";

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

  @Column({ length: 20, default: "pending" })
  status: string; // pending, partial, completed, cancelled

  @Column("text", { nullable: true })
  notes: string;

  @OneToMany("PurchaseOrderItem", "purchaseOrder", { cascade: true })
  items: import("./purchase-order-item.entity").PurchaseOrderItem[];
}
