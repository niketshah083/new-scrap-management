import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { WeighbridgeMaster } from "./weighbridge-master.entity";

@Entity("weighbridge_configs")
export class WeighbridgeConfig extends BaseEntity {
  @Column({ name: "weighbridge_master_id" })
  weighbridgeMasterId: number;

  @ManyToOne(() => WeighbridgeMaster)
  @JoinColumn({ name: "weighbridge_master_id" })
  weighbridgeMaster: WeighbridgeMaster;

  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "serial_port", length: 50 })
  serialPort: string;

  @Column({ name: "baud_rate", default: 9600 })
  baudRate: number;

  @Column({ name: "data_bits", default: 8 })
  dataBits: number;

  @Column({ name: "stop_bits", default: 1 })
  stopBits: number;

  @Column({ length: 10, default: "none" })
  parity: string;

  @Column({ name: "weight_regex", length: 255, nullable: true })
  weightRegex: string;

  @Column({ name: "weight_start_marker", length: 50, nullable: true })
  weightStartMarker: string;

  @Column({ name: "weight_end_marker", length: 50, nullable: true })
  weightEndMarker: string;

  @Column({
    name: "weight_multiplier",
    type: "decimal",
    precision: 10,
    scale: 4,
    default: 1,
  })
  weightMultiplier: number;

  @Column({ name: "weight_unit", length: 20, default: "kg" })
  weightUnit: string;

  @Column({ name: "polling_interval", default: 1000 })
  pollingInterval: number;

  @Column({ name: "stable_readings", default: 3 })
  stableReadings: number;

  @Column({
    name: "stability_threshold",
    type: "decimal",
    precision: 10,
    scale: 4,
    default: 0.5,
  })
  stabilityThreshold: number;

  @Column({ name: "is_active", default: true })
  isActive: boolean;
}
