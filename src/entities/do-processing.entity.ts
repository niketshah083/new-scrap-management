import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { DoProcessingItem } from "./do-processing-item.entity";

export enum DoProcessingStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

export enum DoProcessingStep {
  GateEntry = "gate_entry", // Step 1: Truck arrives, RFID issued
  InitialWeighing = "initial_weighing", // Step 2: Weighbridge-1 tare weight
  ItemLoading = "item_loading", // Step 3-7: Loading items at weighbridge-2
  FinalWeighing = "final_weighing", // Step 8: Final weighbridge-1 gross weight
  Completed = "completed", // Step 9: Process complete
}

@Entity("do_processing")
@Index(["tenantId", "doNumber"])
export class DoProcessing extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  // Reference to external DO
  @Column({ name: "external_do_id", length: 100, nullable: true })
  externalDoId: string;

  @Column({ name: "do_number", length: 100 })
  doNumber: string;

  @Column({ name: "do_date", type: "date", nullable: true })
  doDate: Date;

  // Vendor info (copied from external DO)
  @Column({ name: "vendor_id", length: 100, nullable: true })
  vendorId: string;

  @Column({ name: "vendor_name", length: 255, nullable: true })
  vendorName: string;

  // Transporter info
  @Column({ name: "transporter_id", length: 100, nullable: true })
  transporterId: string;

  @Column({ name: "transporter_name", length: 255, nullable: true })
  transporterName: string;

  @Column({ name: "transporter_gstin", length: 20, nullable: true })
  transporterGstin: string;

  // Vehicle and driver info
  @Column({ name: "vehicle_no", length: 50, nullable: true })
  vehicleNo: string;

  @Column({ name: "driver_name", length: 100, nullable: true })
  driverName: string;

  @Column({ name: "driver_phone", length: 20, nullable: true })
  driverPhone: string;

  @Column({ name: "driver_license", length: 100, nullable: true })
  driverLicense: string;

  // RFID tracking
  @Column({ name: "rfid_tag", length: 100, nullable: true })
  rfidTag: string;

  @Column({ name: "rfid_issued_time", type: "datetime", nullable: true })
  rfidIssuedTime: Date;

  @Column({ name: "rfid_card_id", nullable: true })
  rfidCardId: number;

  // Step 1: Gate Entry
  @Column({ name: "gate_entry_time", type: "datetime", nullable: true })
  gateEntryTime: Date;

  // Step 2: Initial Weighing (Weighbridge-1 - Tare Weight)
  @Column({
    name: "initial_tare_weight",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  initialTareWeight: number;

  @Column({ name: "initial_weighing_time", type: "datetime", nullable: true })
  initialWeighingTime: Date;

  @Column({ name: "initial_weighbridge_id", nullable: true })
  initialWeighbridgeId: number;

  // Driver and truck photos
  @Column({ name: "driver_photo_path", length: 500, nullable: true })
  driverPhotoPath: string;

  @Column({ name: "license_photo_path", length: 500, nullable: true })
  licensePhotoPath: string;

  @Column({ name: "truck_photo_path", length: 500, nullable: true })
  truckPhotoPath: string;

  // Step 8: Final Weighing (Weighbridge-1 - Gross Weight)
  @Column({
    name: "final_gross_weight",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  finalGrossWeight: number;

  @Column({ name: "final_weighing_time", type: "datetime", nullable: true })
  finalWeighingTime: Date;

  @Column({ name: "final_weighbridge_id", nullable: true })
  finalWeighbridgeId: number;

  // Calculated total weights
  @Column({
    name: "total_loaded_weight",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  totalLoadedWeight: number;

  @Column({
    name: "net_weight",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  netWeight: number; // finalGrossWeight - initialTareWeight

  // Status tracking
  @Column({
    type: "enum",
    enum: DoProcessingStatus,
    default: DoProcessingStatus.Pending,
  })
  status: DoProcessingStatus;

  @Column({
    name: "current_step",
    type: "enum",
    enum: DoProcessingStep,
    default: DoProcessingStep.GateEntry,
  })
  currentStep: DoProcessingStep;

  @Column({ name: "completed_time", type: "datetime", nullable: true })
  completedTime: Date;

  @Column("text", { nullable: true })
  remarks: string;

  // Items
  @OneToMany(() => DoProcessingItem, (item) => item.doProcessing, {
    cascade: true,
  })
  items: DoProcessingItem[];
}
