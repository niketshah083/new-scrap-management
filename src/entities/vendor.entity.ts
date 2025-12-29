import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";

@Entity("vendors")
export class Vendor extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "company_name", length: 255 })
  companyName: string;

  @Column({ name: "contact_person", length: 255 })
  contactPerson: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255 })
  email: string;

  @Column("text")
  address: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;
}
