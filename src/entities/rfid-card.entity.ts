import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { User } from "./user.entity";

export enum RFIDCardStatus {
  AVAILABLE = "available",
  ASSIGNED = "assigned",
  DAMAGED = "damaged",
  LOST = "lost",
}

@Entity("rfid_cards")
export class RFIDCard extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "card_number", length: 50, unique: true })
  cardNumber: string;

  @Column({ name: "grn_id", nullable: true })
  grnId: number | null;

  @Column({
    type: "enum",
    enum: RFIDCardStatus,
    default: RFIDCardStatus.AVAILABLE,
  })
  status: RFIDCardStatus;

  @Column({ name: "assigned_at", type: "timestamp", nullable: true })
  assignedAt: Date | null;

  @Column({ name: "last_scanned_at", type: "timestamp", nullable: true })
  lastScannedAt: Date | null;

  @Column({ name: "last_scanned_by", nullable: true })
  lastScannedBy: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "last_scanned_by" })
  lastScannedByUser: User;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ length: 100, nullable: true })
  label: string; // Friendly name like "Card #001"
}
