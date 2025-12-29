import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vendor } from "../../entities/vendor.entity";
import { CreateVendorDto, UpdateVendorDto } from "./dto";
import { DataSourceFactoryService, VendorDto } from "../data-source";

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    private dataSourceFactory: DataSourceFactoryService
  ) {}

  async create(
    tenantId: number,
    createVendorDto: CreateVendorDto,
    userId: number
  ): Promise<Vendor> {
    // Check if vendor with same email already exists for this tenant
    const existingVendor = await this.vendorRepository.findOne({
      where: { tenantId, email: createVendorDto.email },
    });

    if (existingVendor) {
      throw new ConflictException("Vendor with this email already exists");
    }

    const vendor = this.vendorRepository.create({
      ...createVendorDto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.vendorRepository.save(vendor);
  }

  /**
   * Find all vendors - uses external DB if configured
   */
  async findAll(tenantId: number): Promise<VendorDto[]> {
    return this.dataSourceFactory.getVendors(tenantId);
  }

  /**
   * Find a single vendor by ID - uses external DB if configured
   */
  async findOne(tenantId: number, id: number): Promise<VendorDto> {
    const vendor = await this.dataSourceFactory.getVendor(tenantId, id);

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  /**
   * Find internal vendor entity (for updates/deletes)
   */
  async findInternalVendor(tenantId: number, id: number): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({
      where: { id, tenantId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  async update(
    tenantId: number,
    id: number,
    updateVendorDto: UpdateVendorDto,
    userId: number
  ): Promise<Vendor> {
    const vendor = await this.findInternalVendor(tenantId, id);

    // Check if email is being changed and if it already exists
    if (updateVendorDto.email && updateVendorDto.email !== vendor.email) {
      const existingVendor = await this.vendorRepository.findOne({
        where: { tenantId, email: updateVendorDto.email },
      });

      if (existingVendor) {
        throw new ConflictException("Vendor with this email already exists");
      }
    }

    Object.assign(vendor, {
      ...updateVendorDto,
      updatedBy: userId,
    });

    return this.vendorRepository.save(vendor);
  }

  async remove(tenantId: number, id: number, userId: number): Promise<void> {
    const vendor = await this.findInternalVendor(tenantId, id);

    vendor.deletedBy = userId;
    await this.vendorRepository.save(vendor);

    await this.vendorRepository.softRemove(vendor);
  }

  async toggleStatus(
    tenantId: number,
    id: number,
    userId: number
  ): Promise<Vendor> {
    const vendor = await this.findInternalVendor(tenantId, id);
    vendor.isActive = !vendor.isActive;
    vendor.updatedBy = userId;
    return this.vendorRepository.save(vendor);
  }

  /**
   * Find active vendors - uses external DB if configured
   */
  async findActiveVendors(tenantId: number): Promise<VendorDto[]> {
    return this.dataSourceFactory.getVendors(tenantId, { isActive: true });
  }

  /**
   * Check if external DB is enabled for this tenant
   */
  async isExternalDbEnabled(tenantId: number): Promise<boolean> {
    return this.dataSourceFactory.isExternalDbEnabled(tenantId);
  }
}
