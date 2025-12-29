import { Entity, Column, OneToOne, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { Plan } from "./plan.entity";

@Entity("subscriptions")
export class Subscription extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId: number;

  @OneToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "plan_id" })
  planId: number;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: "plan_id" })
  plan: Plan;

  @Column({ name: "start_date", type: "date" })
  startDate: Date;

  @Column({ name: "end_date", type: "date" })
  endDate: Date;

  @Column({ length: 20, default: "active" })
  status: string; // active, expired, cancelled
}
