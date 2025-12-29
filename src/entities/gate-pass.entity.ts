import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { GRN } from "./grn.entity";

@Entity("gate_passes")
export class GatePass extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "grn_id" })
  grnId: number;

  @OneToOne(() => GRN)
  @JoinColumn({ name: "grn_id" })
  grn: GRN;

  @Column({ name: "pass_number", length: 50, unique: true })
  passNumber: string;

  @Column({ name: "issued_at", type: "datetime" })
  issuedAt: Date;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt: Date;

  @Column({ name: "expiry_minutes", default: 60 })
  expiryMinutes: number;

  @Column({ length: 20, default: "active" })
  status: string; // active, used, expired

  @Column({ name: "used_at", type: "datetime", nullable: true })
  usedAt: Date;

  @Column({ name: "used_by", nullable: true })
  usedBy: number;

  @Column("text", { nullable: true })
  notes: string;
}
