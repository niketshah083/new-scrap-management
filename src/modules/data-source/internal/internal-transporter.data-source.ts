import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Transporter } from "../../../entities/transporter.entity";
import { ITransporterDataSource, TransporterDto } from "../interfaces";

/**
 * Internal Transporter Data Source
 * Fetches transporter data from the internal application database
 */
@Injectable()
export class InternalTransporterDataSource implements ITransporterDataSource {
  constructor(
    @InjectRepository(Transporter)
    private readonly transporterRepository: Repository<Transporter>
  ) {}

  /**
   * Find all transporters for a tenant
   */
  async findAll(
    tenantId: number,
    filters?: Record<string, any>
  ): Promise<TransporterDto[]> {
    const queryBuilder = this.transporterRepository
      .createQueryBuilder("transporter")
      .where("transporter.tenantId = :tenantId", { tenantId });

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere("transporter.isActive = :isActive", {
        isActive: filters.isActive,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        "(transporter.transporterName LIKE :search OR transporter.gstin LIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    const transporters = await queryBuilder.getMany();
    return transporters.map((transporter) => this.toDto(transporter));
  }

  /**
   * Find a single transporter by ID
   */
  async findOne(
    tenantId: number,
    id: number | string
  ): Promise<TransporterDto | null> {
    const transporter = await this.transporterRepository.findOne({
      where: { id: Number(id), tenantId },
    });

    return transporter ? this.toDto(transporter) : null;
  }

  /**
   * Find multiple transporters by IDs
   */
  async findByIds(
    tenantId: number,
    ids: (number | string)[]
  ): Promise<TransporterDto[]> {
    const numericIds = ids.map((id) => Number(id));
    const transporters = await this.transporterRepository.find({
      where: { id: In(numericIds), tenantId },
    });

    return transporters.map((transporter) => this.toDto(transporter));
  }

  /**
   * Convert entity to DTO
   */
  private toDto(transporter: Transporter): TransporterDto {
    return {
      id: transporter.id,
      transporterName: transporter.transporterName,
      gstin: transporter.gstin,
      mobileNo: transporter.mobileNo,
      gstState: transporter.gstState,
      isActive: transporter.isActive,
      isExternal: false,
    };
  }
}
