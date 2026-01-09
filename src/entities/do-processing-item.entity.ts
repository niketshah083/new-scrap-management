import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "./base.entity";
import { DoProcessing } from "./do-processing.entity";

export enum DoItemLoadingStatus {
  Pending = "pending", // Item not yet loaded
  AtWeighbridge = "at_weighbridge", // Item at weighbridge-2, ready for loading
  Loading = "loading", // Item being loaded
  Loaded = "loaded", // Item loaded and weighed
  Skipped = "skipped", // Item skipped
}

@Entity("do_processing_items")
@Index(["doProcessingId"])
export class DoProcessingItem extends BaseEntity {
  @Column({ name: "do_processing_id" })
  doProcessingId: number;

  @ManyToOne(() => DoProcessing, (dp) => dp.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "do_processing_id" })
  doProcessing: DoProcessing;

  // Reference to external item
  @Column({ name: "external_item_id", length: 100, nullable: true })
  externalItemId: string;

  // Material info (copied from external DO item)
  @Column({ name: "material_id", length: 100, nullable: true })
  materialId: string;

  @Column({ name: "material_name", length: 255, nullable: true })
  materialName: string;

  @Column({ name: "material_code", length: 100, nullable: true })
  materialCode: string;

  // Ordered quantity from DO
  @Column({
    name: "ordered_quantity",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  orderedQuantity: number;

  @Column({
    name: "ordered_rate",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  orderedRate: number;

  // Step 4: Weighbridge-2 measurements for this item
  @Column({
    name: "tare_weight_wb2",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  tareWeightWb2: number; // Truck weight before loading this item (at weighbridge-2)

  @Column({ name: "tare_time_wb2", type: "datetime", nullable: true })
  tareTimeWb2: Date;

  // Step 5/6: After loading measurements
  @Column({
    name: "gross_weight_wb2",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  grossWeightWb2: number; // Truck weight after loading this item (at weighbridge-2)

  @Column({ name: "gross_time_wb2", type: "datetime", nullable: true })
  grossTimeWb2: Date;

  @Column({
    name: "loaded_weight",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  loadedWeight: number; // Calculated: grossWeightWb2 - tareWeightWb2

  @Column({ name: "weighbridge_id", nullable: true })
  weighbridgeId: number; // Weighbridge-2 ID

  // Loading status and timing
  @Column({
    name: "loading_status",
    type: "enum",
    enum: DoItemLoadingStatus,
    default: DoItemLoadingStatus.Pending,
  })
  loadingStatus: DoItemLoadingStatus;

  // Sequence/order of loading
  @Column({ name: "loading_sequence", nullable: true })
  loadingSequence: number;

  @Column({ name: "loading_start_time", type: "datetime", nullable: true })
  loadingStartTime: Date;

  @Column({ name: "loading_complete_time", type: "datetime", nullable: true })
  loadingCompleteTime: Date;

  @Column("text", { name: "item_remarks", nullable: true })
  itemRemarks: string;
}
