import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";

@Entity("materials")
export class Material extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  code: string;

  @Column({ name: "unit_of_measure", length: 50 })
  unitOfMeasure: string;

  @Column({ length: 100 })
  category: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;
}
