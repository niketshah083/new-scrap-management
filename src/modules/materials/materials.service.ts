import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Material } from "../../entities/material.entity";
import { CreateMaterialDto, UpdateMaterialDto } from "./dto";
import { DataSourceFactoryService, MaterialDto } from "../data-source";

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    private dataSourceFactory: DataSourceFactoryService
  ) {}

  async create(
    tenantId: number,
    createMaterialDto: CreateMaterialDto,
    userId: number
  ): Promise<Material> {
    // Check if material with same code already exists for this tenant
    const existingMaterial = await this.materialRepository.findOne({
      where: { tenantId, code: createMaterialDto.code },
    });

    if (existingMaterial) {
      throw new ConflictException("Material with this code already exists");
    }

    const material = this.materialRepository.create({
      ...createMaterialDto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.materialRepository.save(material);
  }

  /**
   * Find all materials - uses external DB if configured
   */
  async findAllFromDataSource(tenantId: number): Promise<MaterialDto[]> {
    return this.dataSourceFactory.getMaterials(tenantId);
  }

  /**
   * Find a single material by ID - uses external DB if configured
   */
  async findOneFromDataSource(
    tenantId: number,
    id: number
  ): Promise<MaterialDto | null> {
    return this.dataSourceFactory.getMaterial(tenantId, id);
  }

  async findAll(tenantId: number): Promise<Material[]> {
    return this.materialRepository.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(tenantId: number, id: number): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id, tenantId },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    return material;
  }

  async update(
    tenantId: number,
    id: number,
    updateMaterialDto: UpdateMaterialDto,
    userId: number
  ): Promise<Material> {
    const material = await this.findOne(tenantId, id);

    // Check if code is being changed and if it already exists
    if (updateMaterialDto.code && updateMaterialDto.code !== material.code) {
      const existingMaterial = await this.materialRepository.findOne({
        where: { tenantId, code: updateMaterialDto.code },
      });

      if (existingMaterial) {
        throw new ConflictException("Material with this code already exists");
      }
    }

    Object.assign(material, {
      ...updateMaterialDto,
      updatedBy: userId,
    });

    return this.materialRepository.save(material);
  }

  async remove(tenantId: number, id: number, userId: number): Promise<void> {
    const material = await this.findOne(tenantId, id);

    material.deletedBy = userId;
    await this.materialRepository.save(material);

    await this.materialRepository.softRemove(material);
  }

  async toggleStatus(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<Material> {
    const material = await this.findOne(tenantId, id);
    material.isActive = !material.isActive;
    material.updatedBy = userId;
    return this.materialRepository.save(material);
  }

  async findActiveMaterials(tenantId: number): Promise<Material[]> {
    return this.materialRepository.find({
      where: { tenantId, isActive: true },
      order: { name: "ASC" },
    });
  }

  async findByCategory(
    tenantId: number,
    category: string
  ): Promise<Material[]> {
    return this.materialRepository.find({
      where: { tenantId, category, isActive: true },
      order: { name: "ASC" },
    });
  }

  /**
   * Find active materials - uses external DB if configured
   */
  async findActiveMaterialsFromDataSource(
    tenantId: number
  ): Promise<MaterialDto[]> {
    return this.dataSourceFactory.getMaterials(tenantId, { isActive: true });
  }

  /**
   * Check if external DB is enabled for this tenant
   */
  async isExternalDbEnabled(tenantId: number): Promise<boolean> {
    return this.dataSourceFactory.isExternalDbEnabled(tenantId);
  }
}
