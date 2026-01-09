import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { Vendor } from "./vendor.entity";

@Entity("delivery_orders")
export class DeliveryOrder extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "do_number", length: 50, unique: true })
  doNumber: string;

  @Column({ name: "vendor_id" })
  vendorId: number;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: "vendor_id" })
  vendor: Vendor;

  @Column({ name: "do_date", type: "date" })
  doDate: Date;

  // Weigh Bridge Details
  @Column({ name: "vehicle_no", length: 50, nullable: true })
  vehicleNo: string;

  @Column("decimal", {
    name: "gross_weight",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  grossWeight: number;

  @Column("decimal", {
    name: "tare_weight",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  tareWeight: number;

  @Column("decimal", {
    name: "net_weight",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  netWeight: number;

  // Totals
  @Column("decimal", {
    name: "total_amount",
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column("text", { nullable: true })
  remarks: string;

  @OneToMany("DeliveryOrderItem", "deliveryOrder", { cascade: true })
  items: import("./delivery-order-item.entity").DeliveryOrderItem[];
}
