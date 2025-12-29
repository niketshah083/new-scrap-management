import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { PurchaseOrder } from "./purchase-order.entity";
import { Material } from "./material.entity";

@Entity("purchase_order_items")
export class PurchaseOrderItem extends BaseEntity {
  @Column({ name: "purchase_order_id" })
  purchaseOrderId: number;

  @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "purchase_order_id" })
  purchaseOrder: PurchaseOrder;

  @Column({ name: "material_id" })
  materialId: number;

  @ManyToOne(() => Material)
  @JoinColumn({ name: "material_id" })
  material: Material;

  @Column("decimal", { precision: 10, scale: 2 })
  quantity: number;

  @Column("decimal", { name: "unit_price", precision: 10, scale: 2 })
  unitPrice: number;

  @Column("decimal", {
    name: "total_price",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  totalPrice: number;
}
