import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { Permission } from "./permission.entity";

@Entity("roles")
export class Role extends BaseEntity {
  @Column({ name: "tenant_id", nullable: true })
  tenantId: number;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ length: 100 })
  name: string;

  @Column("text", { nullable: true })
  description: string;

  @Column({ name: "is_default", default: false })
  isDefault: boolean;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "role_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" },
  })
  permissions: Permission[];
}
