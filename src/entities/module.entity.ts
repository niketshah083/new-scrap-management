import { Entity, Column } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("modules")
export class Module extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column("text", { nullable: true })
  description: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;
}
