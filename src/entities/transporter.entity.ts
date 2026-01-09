import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";

@Entity("transporters")
@Index(["tenantId", "gstin"], { unique: true })
export class Transporter extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "transporter_name", length: 255 })
  transporterName: string;

  @Column({ length: 20, nullable: true })
  gstin: string;

  @Column({ name: "mobile_no", length: 20, nullable: true })
  mobileNo: string;

  @Column({ name: "gst_state", length: 100, nullable: true })
  gstState: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;
}
