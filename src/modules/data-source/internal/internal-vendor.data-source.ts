import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Vendor } from "../../../entities/vendor.entity";
import { IVendorDataSource, VendorDto } from "../interfaces";

/**
 * Internal Vendor Data Source
 * Fetches vendor data from the internal application database
 */
@Injectable()
export class InternalVendorDataSource implements IVendorDataSource {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>
  ) {}

  /**
   * Find all vendors for a tenant
   */
  async findAll(
    tenantId: number,
    filters?: Record<string, any>
  ): Promise<VendorDto[]> {
    const queryBuilder = this.vendorRepository
      .createQueryBuilder("vendor")
      .where("vendor.tenantId = :tenantId", { tenantId });

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere("vendor.isActive = :isActive", {
        isActive: filters.isActive,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        "(vendor.companyName LIKE :search OR vendor.contactPerson LIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    const vendors = await queryBuilder.getMany();
    return vendors.map((vendor) => this.toDto(vendor));
  }

  /**
   * Find a single vendor by ID
   */
  async findOne(
    tenantId: number,
    id: number | string
  ): Promise<VendorDto | null> {
    const vendor = await this.vendorRepository.findOne({
      where: { id: Number(id), tenantId },
    });

    return vendor ? this.toDto(vendor) : null;
  }

  /**
   * Find multiple vendors by IDs
   */
  async findByIds(
    tenantId: number,
    ids: (number | string)[]
  ): Promise<VendorDto[]> {
    const numericIds = ids.map((id) => Number(id));
    const vendors = await this.vendorRepository.find({
      where: { id: In(numericIds), tenantId },
    });

    return vendors.map((vendor) => this.toDto(vendor));
  }

  /**
   * Convert entity to DTO
   */
  private toDto(vendor: Vendor): VendorDto {
    return {
      id: vendor.id,
      companyName: vendor.companyName,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      isActive: vendor.isActive,
      isExternal: false,
    };
  }
}
