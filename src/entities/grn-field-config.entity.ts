import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";

@Entity("grn_field_configs")
export class GRNFieldConfig extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "step_number", type: "tinyint" })
  stepNumber: number; // 1-7

  @Column({ name: "field_name", length: 100 })
  fieldName: string;

  @Column({ name: "field_label", length: 255 })
  fieldLabel: string;

  @Column({ name: "field_type", length: 50 })
  fieldType: string; // text, number, date, file, photo, dropdown

  @Column({ name: "is_required", default: false })
  isRequired: boolean;

  @Column({ name: "display_order", type: "int", default: 0 })
  displayOrder: number;

  @Column("json", { nullable: true })
  options: string[]; // For dropdown type

  @Column({ name: "allow_multiple", default: false })
  allowMultiple: boolean; // For file/photo type - allow multiple files

  @Column({ name: "max_files", type: "int", default: 1 })
  maxFiles: number; // For file/photo type - max number of files when allowMultiple is true

  @Column({ name: "is_active", default: true })
  isActive: boolean;
}
