import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { User } from "./user.entity";

@Entity("notifications")
export class Notification extends BaseEntity {
  @Column({ name: "tenant_id", nullable: true })
  tenantId: number;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "user_id", nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ length: 50 })
  type: string; // grn_status, gate_pass_expiry, qc_result, subscription_expiry

  @Column({ length: 255 })
  title: string;

  @Column("text")
  message: string;

  @Column("json", { nullable: true })
  metadata: {
    entityType?: string;
    entityId?: number;
    actionUrl?: string;
    [key: string]: any;
  };

  @Column({ name: "is_read", default: false })
  isRead: boolean;

  @Column({ name: "read_at", type: "datetime", nullable: true })
  readAt: Date;

  @Column({ length: 20, default: "info" })
  priority: string; // low, info, warning, high, critical
}
