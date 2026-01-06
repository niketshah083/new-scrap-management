import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./tenant.entity";
import { CameraMaster } from "./camera-master.entity";

export enum CameraTransport {
  TCP = "tcp",
  UDP = "udp",
}

@Entity("camera_configs")
export class CameraConfig extends BaseEntity {
  @Column({ name: "camera_master_id" })
  cameraMasterId: number;

  @ManyToOne(() => CameraMaster)
  @JoinColumn({ name: "camera_master_id" })
  cameraMaster: CameraMaster;

  @Column({ name: "tenant_id" })
  tenantId: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "rtsp_url", length: 500, nullable: true })
  rtspUrl: string;

  @Column({ name: "stream_url", length: 500, nullable: true })
  streamUrl: string;

  @Column({ length: 100, nullable: true })
  username: string;

  @Column({ length: 500, nullable: true })
  password: string; // Encrypted

  @Column({ name: "snapshot_width", default: 1280 })
  snapshotWidth: number;

  @Column({ name: "snapshot_height", default: 720 })
  snapshotHeight: number;

  @Column({ name: "snapshot_quality", default: 80 })
  snapshotQuality: number;

  @Column({
    type: "enum",
    enum: CameraTransport,
    default: CameraTransport.TCP,
  })
  transport: CameraTransport;

  @Column({ default: 10000 })
  timeout: number;

  @Column({ name: "is_active", default: true })
  isActive: boolean;
}
