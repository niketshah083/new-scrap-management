import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Module } from "./module.entity";
import { Operation } from "./operation.entity";

@Entity("permissions")
export class Permission extends BaseEntity {
  @Column({ name: "module_id" })
  moduleId: number;

  @ManyToOne(() => Module)
  @JoinColumn({ name: "module_id" })
  module: Module;

  @Column({ name: "operation_id" })
  operationId: number;

  @ManyToOne(() => Operation)
  @JoinColumn({ name: "operation_id" })
  operation: Operation;

  @Column({ length: 100, unique: true })
  code: string; // e.g., "Vendor:Create", "PurchaseOrder:List"
}
