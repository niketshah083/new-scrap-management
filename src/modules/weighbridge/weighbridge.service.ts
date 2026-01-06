import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WeighbridgeMaster, WeighbridgeConfig } from "../../entities";
import {
  CreateWeighbridgeMasterDto,
  UpdateWeighbridgeMasterDto,
  CreateWeighbridgeConfigDto,
  UpdateWeighbridgeConfigDto,
} from "./dto";
import { DeviceBridgeGateway } from "../device-bridge/device-bridge.gateway";

@Injectable()
export class WeighbridgeService {
  constructor(
    @InjectRepository(WeighbridgeMaster)
    private weighbridgeMasterRepository: Repository<WeighbridgeMaster>,
    @InjectRepository(WeighbridgeConfig)
    private weighbridgeConfigRepository: Repository<WeighbridgeConfig>,
    @Inject(forwardRef(() => DeviceBridgeGateway))
    private deviceBridgeGateway: DeviceBridgeGateway
  ) {}

  // WeighbridgeMaster CRUD operations

  async createMaster(
    tenantId: number,
    createDto: CreateWeighbridgeMasterDto,
    userId: number
  ): Promise<WeighbridgeMaster> {
    const existing = await this.weighbridgeMasterRepository.findOne({
      where: { tenantId, code: createDto.code },
    });

    if (existing) {
      throw new ConflictException("Weighbridge with this code already exists");
    }

    const weighbridge = this.weighbridgeMasterRepository.create({
      ...createDto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.weighbridgeMasterRepository.save(weighbridge);
  }

  async findAllMasters(tenantId: number): Promise<WeighbridgeMaster[]> {
    return this.weighbridgeMasterRepository.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
    });
  }

  async findOneMaster(
    tenantId: number,
    id: number
  ): Promise<WeighbridgeMaster> {
    const weighbridge = await this.weighbridgeMasterRepository.findOne({
      where: { id, tenantId },
    });

    if (!weighbridge) {
      throw new NotFoundException(`Weighbridge with ID ${id} not found`);
    }

    return weighbridge;
  }

  async updateMaster(
    tenantId: number,
    id: number,
    updateDto: UpdateWeighbridgeMasterDto,
    userId: number
  ): Promise<WeighbridgeMaster> {
    const weighbridge = await this.findOneMaster(tenantId, id);

    if (updateDto.code && updateDto.code !== weighbridge.code) {
      const existing = await this.weighbridgeMasterRepository.findOne({
        where: { tenantId, code: updateDto.code },
      });

      if (existing) {
        throw new ConflictException(
          "Weighbridge with this code already exists"
        );
      }
    }

    Object.assign(weighbridge, {
      ...updateDto,
      updatedBy: userId,
    });

    return this.weighbridgeMasterRepository.save(weighbridge);
  }

  async removeMaster(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<void> {
    const weighbridge = await this.findOneMaster(tenantId, id);
    weighbridge.deletedBy = userId;
    await this.weighbridgeMasterRepository.save(weighbridge);
    await this.weighbridgeMasterRepository.softRemove(weighbridge);
  }

  async toggleMasterStatus(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<WeighbridgeMaster> {
    const weighbridge = await this.findOneMaster(tenantId, id);
    weighbridge.isActive = !weighbridge.isActive;
    weighbridge.updatedBy = userId;
    return this.weighbridgeMasterRepository.save(weighbridge);
  }

  async findActiveMasters(tenantId: number): Promise<WeighbridgeMaster[]> {
    return this.weighbridgeMasterRepository.find({
      where: { tenantId, isActive: true },
      order: { name: "ASC" },
    });
  }

  // WeighbridgeConfig CRUD operations

  async createConfig(
    tenantId: number,
    createDto: CreateWeighbridgeConfigDto,
    userId: number
  ): Promise<WeighbridgeConfig> {
    // Verify the weighbridge master exists and belongs to tenant
    await this.findOneMaster(tenantId, createDto.weighbridgeMasterId);

    const config = this.weighbridgeConfigRepository.create({
      ...createDto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.weighbridgeConfigRepository.save(config);
  }

  async findAllConfigs(tenantId: number): Promise<WeighbridgeConfig[]> {
    return this.weighbridgeConfigRepository.find({
      where: { tenantId },
      relations: ["weighbridgeMaster"],
      order: { createdAt: "DESC" },
    });
  }

  async findOneConfig(
    tenantId: number,
    id: number
  ): Promise<WeighbridgeConfig> {
    const config = await this.weighbridgeConfigRepository.findOne({
      where: { id, tenantId },
      relations: ["weighbridgeMaster"],
    });

    if (!config) {
      throw new NotFoundException(`Weighbridge config with ID ${id} not found`);
    }

    return config;
  }

  async findConfigByMasterId(
    tenantId: number,
    weighbridgeMasterId: number
  ): Promise<WeighbridgeConfig | null> {
    return this.weighbridgeConfigRepository.findOne({
      where: { tenantId, weighbridgeMasterId },
      relations: ["weighbridgeMaster"],
    });
  }

  async updateConfig(
    tenantId: number,
    id: number,
    updateDto: UpdateWeighbridgeConfigDto,
    userId: number
  ): Promise<WeighbridgeConfig> {
    const config = await this.findOneConfig(tenantId, id);

    Object.assign(config, {
      ...updateDto,
      updatedBy: userId,
    });

    const savedConfig = await this.weighbridgeConfigRepository.save(config);

    // Broadcast config update to connected devices
    this.deviceBridgeGateway.broadcastWeighbridgeConfigUpdate(tenantId, id);

    return savedConfig;
  }

  async removeConfig(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<void> {
    const config = await this.findOneConfig(tenantId, id);
    config.deletedBy = userId;
    await this.weighbridgeConfigRepository.save(config);
    await this.weighbridgeConfigRepository.softRemove(config);
  }

  async toggleConfigStatus(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<WeighbridgeConfig> {
    const config = await this.findOneConfig(tenantId, id);
    config.isActive = !config.isActive;
    config.updatedBy = userId;
    return this.weighbridgeConfigRepository.save(config);
  }
}
