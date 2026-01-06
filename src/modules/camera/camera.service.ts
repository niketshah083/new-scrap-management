import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CameraMaster, CameraConfig } from "../../entities";
import {
  CreateCameraMasterDto,
  UpdateCameraMasterDto,
  CreateCameraConfigDto,
  UpdateCameraConfigDto,
} from "./dto";
import { DeviceBridgeGateway } from "../device-bridge/device-bridge.gateway";

@Injectable()
export class CameraService {
  constructor(
    @InjectRepository(CameraMaster)
    private cameraMasterRepository: Repository<CameraMaster>,
    @InjectRepository(CameraConfig)
    private cameraConfigRepository: Repository<CameraConfig>,
    @Inject(forwardRef(() => DeviceBridgeGateway))
    private deviceBridgeGateway: DeviceBridgeGateway
  ) {}

  // CameraMaster CRUD operations

  async createMaster(
    tenantId: number,
    createDto: CreateCameraMasterDto,
    userId: number
  ): Promise<CameraMaster> {
    const existing = await this.cameraMasterRepository.findOne({
      where: { tenantId, code: createDto.code },
    });

    if (existing) {
      throw new ConflictException("Camera with this code already exists");
    }

    const camera = this.cameraMasterRepository.create({
      ...createDto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.cameraMasterRepository.save(camera);
  }

  async findAllMasters(tenantId: number): Promise<CameraMaster[]> {
    return this.cameraMasterRepository.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
    });
  }

  async findOneMaster(tenantId: number, id: number): Promise<CameraMaster> {
    const camera = await this.cameraMasterRepository.findOne({
      where: { id, tenantId },
    });

    if (!camera) {
      throw new NotFoundException(`Camera with ID ${id} not found`);
    }

    return camera;
  }

  async updateMaster(
    tenantId: number,
    id: number,
    updateDto: UpdateCameraMasterDto,
    userId: number
  ): Promise<CameraMaster> {
    const camera = await this.findOneMaster(tenantId, id);

    if (updateDto.code && updateDto.code !== camera.code) {
      const existing = await this.cameraMasterRepository.findOne({
        where: { tenantId, code: updateDto.code },
      });

      if (existing) {
        throw new ConflictException("Camera with this code already exists");
      }
    }

    Object.assign(camera, {
      ...updateDto,
      updatedBy: userId,
    });

    return this.cameraMasterRepository.save(camera);
  }

  async removeMaster(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<void> {
    const camera = await this.findOneMaster(tenantId, id);
    camera.deletedBy = userId;
    await this.cameraMasterRepository.save(camera);
    await this.cameraMasterRepository.softRemove(camera);
  }

  async toggleMasterStatus(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<CameraMaster> {
    const camera = await this.findOneMaster(tenantId, id);
    camera.isActive = !camera.isActive;
    camera.updatedBy = userId;
    return this.cameraMasterRepository.save(camera);
  }

  async findActiveMasters(tenantId: number): Promise<CameraMaster[]> {
    return this.cameraMasterRepository.find({
      where: { tenantId, isActive: true },
      order: { name: "ASC" },
    });
  }

  // CameraConfig CRUD operations

  async createConfig(
    tenantId: number,
    createDto: CreateCameraConfigDto,
    userId: number
  ): Promise<CameraConfig> {
    // Verify the camera master exists and belongs to tenant
    await this.findOneMaster(tenantId, createDto.cameraMasterId);

    const config = this.cameraConfigRepository.create({
      ...createDto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.cameraConfigRepository.save(config);
  }

  async findAllConfigs(tenantId: number): Promise<CameraConfig[]> {
    return this.cameraConfigRepository.find({
      where: { tenantId },
      relations: ["cameraMaster"],
      order: { createdAt: "DESC" },
    });
  }

  async findOneConfig(tenantId: number, id: number): Promise<CameraConfig> {
    const config = await this.cameraConfigRepository.findOne({
      where: { id, tenantId },
      relations: ["cameraMaster"],
    });

    if (!config) {
      throw new NotFoundException(`Camera config with ID ${id} not found`);
    }

    return config;
  }

  async findConfigByMasterId(
    tenantId: number,
    cameraMasterId: number
  ): Promise<CameraConfig | null> {
    return this.cameraConfigRepository.findOne({
      where: { tenantId, cameraMasterId },
      relations: ["cameraMaster"],
    });
  }

  async updateConfig(
    tenantId: number,
    id: number,
    updateDto: UpdateCameraConfigDto,
    userId: number
  ): Promise<CameraConfig> {
    const config = await this.findOneConfig(tenantId, id);

    Object.assign(config, {
      ...updateDto,
      updatedBy: userId,
    });

    const savedConfig = await this.cameraConfigRepository.save(config);

    // Broadcast config update to connected devices
    this.deviceBridgeGateway.broadcastCameraConfigUpdate(tenantId, id);

    return savedConfig;
  }

  async removeConfig(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<void> {
    const config = await this.findOneConfig(tenantId, id);
    config.deletedBy = userId;
    await this.cameraConfigRepository.save(config);
    await this.cameraConfigRepository.softRemove(config);
  }

  async toggleConfigStatus(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<CameraConfig> {
    const config = await this.findOneConfig(tenantId, id);
    config.isActive = !config.isActive;
    config.updatedBy = userId;
    return this.cameraConfigRepository.save(config);
  }
}
