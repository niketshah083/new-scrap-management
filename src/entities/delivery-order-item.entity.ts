import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { DeliveryOrder } from "./delivery-order.entity";
import { Material } from "./material.entity";

@Entity("delivery_order_items")
export class DeliveryOrderItem extends BaseEntity {
  @Column({ name: "delivery_order_id" })
  deliveryOrderId: number;

  @ManyToOne(() => DeliveryOrder, (dOrder) => dOrder.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "delivery_order_id" })
  deliveryOrder: DeliveryOrder;

  @Column({ name: "material_id" })
  materialId: number;

  @ManyToOne(() => Material)
  @JoinColumn({ name: "material_id" })
  material: Material;

  @Column("decimal", {
    name: "wb_net_weight",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  wbNetWeight: number;

  @Column("decimal", { precision: 10, scale: 2 })
  quantity: number;

  @Column("decimal", { precision: 10, scale: 2 })
  rate: number;

  @Column("decimal", { precision: 12, scale: 2, nullable: true })
  amount: number;
}
