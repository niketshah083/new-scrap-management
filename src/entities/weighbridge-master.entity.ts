import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";

@Entity("weighbridge_masters")
@Unique("UQ_weighbridge_tenant_code", ["tenantId", "code"])
export class WeighbridgeMaster extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 200, nullable: true })
  location: string;

  @Column("text", { nullable: true })
  description: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;
}
