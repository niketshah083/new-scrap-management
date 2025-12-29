import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { Role } from "./role.entity";

@Entity("users")
export class User extends BaseEntity {
  @Column({ name: "tenant_id", nullable: true })
  tenantId: number;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: "role_id", nullable: true })
  roleId: number;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: "role_id" })
  role: Role;

  @Column({ name: "is_super_admin", default: false })
  isSuperAdmin: boolean;

  @Column({ name: "is_active", default: true })
  isActive: boolean;
}
