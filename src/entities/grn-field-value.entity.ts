import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { GRN } from "./grn.entity";
import { GRNFieldConfig } from "./grn-field-config.entity";

@Entity("grn_field_values")
export class GRNFieldValue extends BaseEntity {
  @Column({ name: "grn_id" })
  grnId: number;

  @ManyToOne(() => GRN, (grn) => grn.fieldValues, { onDelete: "CASCADE" })
  @JoinColumn({ name: "grn_id" })
  grn: GRN;

  @Column({ name: "field_config_id" })
  fieldConfigId: number;

  @ManyToOne(() => GRNFieldConfig)
  @JoinColumn({ name: "field_config_id" })
  fieldConfig: GRNFieldConfig;

  @Column("text", { name: "text_value", nullable: true })
  textValue: string;

  @Column("decimal", {
    name: "number_value",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  numberValue: number;

  @Column({ name: "date_value", type: "date", nullable: true })
  dateValue: Date;

  @Column({ name: "file_url", length: 500, nullable: true })
  fileUrl: string;
}
