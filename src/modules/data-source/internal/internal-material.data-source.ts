import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Material } from "../../../entities/material.entity";
import { IMaterialDataSource, MaterialDto } from "../interfaces";

/**
 * Internal Material Data Source
 * Fetches material data from the internal application database
 */
@Injectable()
export class InternalMaterialDataSource implements IMaterialDataSource {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>
  ) {}

  /**
   * Find all materials for a tenant
   */
  async findAll(
    tenantId: number,
    filters?: Record<string, any>
  ): Promise<MaterialDto[]> {
    const queryBuilder = this.materialRepository
      .createQueryBuilder("material")
      .where("material.tenantId = :tenantId", { tenantId });

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere("material.isActive = :isActive", {
        isActive: filters.isActive,
      });
    }

    if (filters?.category) {
      queryBuilder.andWhere("material.category = :category", {
        category: filters.category,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        "(material.name LIKE :search OR material.code LIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    const materials = await queryBuilder.getMany();
    return materials.map((material) => this.toDto(material));
  }

  /**
   * Find a single material by ID
   */
  async findOne(
    tenantId: number,
    id: number | string
  ): Promise<MaterialDto | null> {
    const material = await this.materialRepository.findOne({
      where: { id: Number(id), tenantId },
    });

    return material ? this.toDto(material) : null;
  }

  /**
   * Find multiple materials by IDs
   */
  async findByIds(
    tenantId: number,
    ids: (number | string)[]
  ): Promise<MaterialDto[]> {
    const numericIds = ids.map((id) => Number(id));
    const materials = await this.materialRepository.find({
      where: { id: In(numericIds), tenantId },
    });

    return materials.map((material) => this.toDto(material));
  }

  /**
   * Convert entity to DTO
   */
  private toDto(material: Material): MaterialDto {
    return {
      id: material.id,
      name: material.name,
      code: material.code,
      unitOfMeasure: material.unitOfMeasure,
      category: material.category,
      isActive: material.isActive,
      isExternal: false,
    };
  }
}
