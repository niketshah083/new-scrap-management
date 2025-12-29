import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { GRN } from "./grn.entity";
import { Material } from "./material.entity";

@Entity("qc_inspections")
export class QCInspection extends BaseEntity {
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

  @Column({ name: "material_id", nullable: true })
  materialId: number;

  @ManyToOne(() => Material, { nullable: true })
  @JoinColumn({ name: "material_id" })
  material: Material;

  @Column({ name: "inspection_number", length: 50, unique: true })
  inspectionNumber: string;

  @Column({ length: 20, default: "pending" })
  status: string; // pending, in_progress, pass, fail

  @Column({ name: "inspected_at", type: "datetime", nullable: true })
  inspectedAt: Date;

  @Column({ name: "inspected_by", nullable: true })
  inspectedBy: number;

  // Test parameters stored as JSON
  @Column("json", { name: "test_parameters", nullable: true })
  testParameters: {
    name: string;
    expectedValue: string;
    actualValue: string;
    unit: string;
    passed: boolean;
  }[];

  @Column("decimal", {
    name: "moisture_content",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  moistureContent: number;

  @Column("decimal", {
    name: "impurity_percentage",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  impurityPercentage: number;

  @Column("decimal", {
    name: "quality_grade",
    precision: 3,
    scale: 1,
    nullable: true,
  })
  qualityGrade: number;

  @Column("text", { nullable: true })
  remarks: string;

  @Column("text", { name: "failure_reason", nullable: true })
  failureReason: string;

  @Column("json", { name: "sample_photos", nullable: true })
  samplePhotos: string[];
}
