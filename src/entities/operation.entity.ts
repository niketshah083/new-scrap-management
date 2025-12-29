import { Entity, Column } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("operations")
export class Operation extends BaseEntity {
  @Column({ length: 50 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string; // Create, Read, Update, Delete, List
}
