import { Entity, Column, ManyToMany, JoinTable } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Module } from "./module.entity";

@Entity("plans")
export class Plan extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column("text", { nullable: true })
  description: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column({ name: "billing_cycle", length: 20 })
  billingCycle: string; // monthly, yearly

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @ManyToMany(() => Module)
  @JoinTable({
    name: "plan_modules",
    joinColumn: { name: "plan_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "module_id", referencedColumnName: "id" },
  })
  modules: Module[];
}
