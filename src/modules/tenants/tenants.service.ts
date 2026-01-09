import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import * as bcrypt from "bcrypt";
import { Tenant } from "../../entities/tenant.entity";
import { User } from "../../entities/user.entity";
import { Role } from "../../entities/role.entity";
import {
  CreateTenantDto,
  UpdateTenantDto,
  UpdateExternalDbConfigDto,
  ExternalDbConfigResponseDto,
} from "./dto";
import { GRNFieldConfigService } from "../grn-field-config/grn-field-config.service";
import { EncryptionService } from "../../common/services/encryption.service";
import { ExternalConnectionService } from "../external-connection/external-connection.service";
import { CacheService } from "../data-source/services/cache.service";

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private grnFieldConfigService: GRNFieldConfigService,
    private encryptionService: EncryptionService,
    private externalConnectionService: ExternalConnectionService,
    private cacheService: CacheService
  ) {}

  async create(
    createTenantDto: CreateTenantDto,
    userId: number
  ): Promise<Tenant & { adminUser?: { email: string; name: string } }> {
    // Check if tenant email already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: { email: createTenantDto.email },
    });

    if (existingTenant) {
      throw new ConflictException("Tenant with this email already exists");
    }

    // Check if admin email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createTenantDto.adminEmail },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Create tenant
    const tenant = this.tenantRepository.create({
      companyName: createTenantDto.companyName,
      email: createTenantDto.email,
      phone: createTenantDto.phone,
      address: createTenantDto.address,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Find the default "Tenant Admin" role (tenant_id IS NULL, isDefault = true)
    const defaultTenantAdminRole = await this.roleRepository.findOne({
      where: { tenantId: IsNull(), name: "Tenant Admin", isDefault: true },
      relations: ["permissions"],
    });

    // Create a copy of the default role for this tenant
    const tenantAdminRole = this.roleRepository.create({
      tenantId: savedTenant.id,
      name: "Tenant Admin",
      description: "Tenant administrator with full access",
      isDefault: true,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
      permissions: defaultTenantAdminRole?.permissions || [],
    });

    const savedRole = await this.roleRepository.save(tenantAdminRole);

    // Create admin user for the tenant
    const hashedPassword = await bcrypt.hash(createTenantDto.adminPassword, 10);
    const adminUser = this.userRepository.create({
      name: createTenantDto.adminName,
      email: createTenantDto.adminEmail,
      password: hashedPassword,
      tenantId: savedTenant.id,
      roleId: savedRole.id,
      isSuperAdmin: false,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    });

    await this.userRepository.save(adminUser);

    // Create default GRN field configurations for the tenant
    await this.grnFieldConfigService.createDefaultFieldsForTenant(
      savedTenant.id,
      userId
    );

    // Return tenant with admin user info
    return {
      ...savedTenant,
      adminUser: {
        email: adminUser.email,
        name: adminUser.name,
      },
    };
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: number): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async update(
    id: number,
    updateTenantDto: UpdateTenantDto,
    userId: number
  ): Promise<Tenant> {
    const tenant = await this.findOne(id);

    // Check if email is being changed and if it already exists
    if (updateTenantDto.email && updateTenantDto.email !== tenant.email) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { email: updateTenantDto.email },
      });

      if (existingTenant) {
        throw new ConflictException("Tenant with this email already exists");
      }
    }

    Object.assign(tenant, {
      ...updateTenantDto,
      updatedBy: userId,
    });

    return this.tenantRepository.save(tenant);
  }

  async remove(id: number, userId: number): Promise<void> {
    const tenant = await this.findOne(id);

    // Soft delete - update deletedBy before removing
    tenant.deletedBy = userId;
    await this.tenantRepository.save(tenant);

    await this.tenantRepository.softRemove(tenant);
  }

  async toggleStatus(id: number, userId: number): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.isActive = !tenant.isActive;
    tenant.updatedBy = userId;
    return this.tenantRepository.save(tenant);
  }

  // External Database Configuration Methods

  /**
   * Get external database configuration for a tenant (excludes password)
   */
  async getExternalDbConfig(id: number): Promise<ExternalDbConfigResponseDto> {
    const tenant = await this.findOne(id);

    return {
      externalDbEnabled: tenant.externalDbEnabled,
      externalDbHost: tenant.externalDbHost,
      externalDbPort: tenant.externalDbPort,
      externalDbName: tenant.externalDbName,
      externalDbUsername: tenant.externalDbUsername,
      externalDbVendorTable: tenant.externalDbVendorTable,
      externalDbPoTable: tenant.externalDbPoTable,
      externalDbMaterialTable: tenant.externalDbMaterialTable,
      externalDbDeliveryOrderTable: tenant.externalDbDeliveryOrderTable,
      externalDbDeliveryOrderItemTable: tenant.externalDbDeliveryOrderItemTable,
      externalDbDoItemRelationKey: tenant.externalDbDoItemRelationKey,
      externalDbCacheTtl: tenant.externalDbCacheTtl,
      externalDbVendorMappings: tenant.externalDbVendorMappings,
      externalDbPoMappings: tenant.externalDbPoMappings,
      externalDbMaterialMappings: tenant.externalDbMaterialMappings,
      externalDbDeliveryOrderMappings: tenant.externalDbDeliveryOrderMappings,
      externalDbDeliveryOrderItemMappings:
        tenant.externalDbDeliveryOrderItemMappings,
      // Vendor join config for DO
      externalDbDoVendorTable: tenant.externalDbDoVendorTable,
      externalDbDoVendorFk: tenant.externalDbDoVendorFk,
      externalDbDoVendorPk: tenant.externalDbDoVendorPk,
      externalDbDoVendorNameField: tenant.externalDbDoVendorNameField,
      // Material join config for DO items
      externalDbDoItemMaterialTable: tenant.externalDbDoItemMaterialTable,
      externalDbDoItemMaterialFk: tenant.externalDbDoItemMaterialFk,
      externalDbDoItemMaterialPk: tenant.externalDbDoItemMaterialPk,
      externalDbDoItemMaterialNameField:
        tenant.externalDbDoItemMaterialNameField,
      // Transporter config
      externalDbTransporterTable: tenant.externalDbTransporterTable,
      externalDbTransporterMappings: tenant.externalDbTransporterMappings,
      hasPassword: !!tenant.externalDbPassword,
    };
  }

  /**
   * Update external database configuration for a tenant
   */
  async updateExternalDbConfig(
    id: number,
    updateDto: UpdateExternalDbConfigDto,
    userId: number
  ): Promise<ExternalDbConfigResponseDto> {
    const tenant = await this.findOne(id);

    // Update fields
    if (updateDto.externalDbEnabled !== undefined) {
      tenant.externalDbEnabled = updateDto.externalDbEnabled;
    }
    if (updateDto.externalDbHost !== undefined) {
      tenant.externalDbHost = updateDto.externalDbHost;
    }
    if (updateDto.externalDbPort !== undefined) {
      tenant.externalDbPort = updateDto.externalDbPort;
    }
    if (updateDto.externalDbName !== undefined) {
      tenant.externalDbName = updateDto.externalDbName;
    }
    if (updateDto.externalDbUsername !== undefined) {
      tenant.externalDbUsername = updateDto.externalDbUsername;
    }
    if (updateDto.externalDbPassword !== undefined) {
      // Encrypt password before storing
      tenant.externalDbPassword = this.encryptionService.encrypt(
        updateDto.externalDbPassword
      );
    }
    if (updateDto.externalDbVendorTable !== undefined) {
      tenant.externalDbVendorTable = updateDto.externalDbVendorTable;
    }
    if (updateDto.externalDbPoTable !== undefined) {
      tenant.externalDbPoTable = updateDto.externalDbPoTable;
    }
    if (updateDto.externalDbMaterialTable !== undefined) {
      tenant.externalDbMaterialTable = updateDto.externalDbMaterialTable;
    }
    if (updateDto.externalDbDeliveryOrderTable !== undefined) {
      tenant.externalDbDeliveryOrderTable =
        updateDto.externalDbDeliveryOrderTable;
    }
    if (updateDto.externalDbCacheTtl !== undefined) {
      tenant.externalDbCacheTtl = updateDto.externalDbCacheTtl;
    }
    if (updateDto.externalDbVendorMappings !== undefined) {
      tenant.externalDbVendorMappings = updateDto.externalDbVendorMappings;
    }
    if (updateDto.externalDbPoMappings !== undefined) {
      tenant.externalDbPoMappings = updateDto.externalDbPoMappings;
    }
    if (updateDto.externalDbMaterialMappings !== undefined) {
      tenant.externalDbMaterialMappings = updateDto.externalDbMaterialMappings;
    }
    if (updateDto.externalDbDeliveryOrderMappings !== undefined) {
      tenant.externalDbDeliveryOrderMappings =
        updateDto.externalDbDeliveryOrderMappings;
    }
    if (updateDto.externalDbDeliveryOrderItemTable !== undefined) {
      tenant.externalDbDeliveryOrderItemTable =
        updateDto.externalDbDeliveryOrderItemTable;
    }
    if (updateDto.externalDbDoItemRelationKey !== undefined) {
      tenant.externalDbDoItemRelationKey =
        updateDto.externalDbDoItemRelationKey;
    }
    if (updateDto.externalDbDeliveryOrderItemMappings !== undefined) {
      tenant.externalDbDeliveryOrderItemMappings =
        updateDto.externalDbDeliveryOrderItemMappings;
    }
    // Vendor join configuration for DO
    if (updateDto.externalDbDoVendorTable !== undefined) {
      tenant.externalDbDoVendorTable = updateDto.externalDbDoVendorTable;
    }
    if (updateDto.externalDbDoVendorFk !== undefined) {
      tenant.externalDbDoVendorFk = updateDto.externalDbDoVendorFk;
    }
    if (updateDto.externalDbDoVendorPk !== undefined) {
      tenant.externalDbDoVendorPk = updateDto.externalDbDoVendorPk;
    }
    if (updateDto.externalDbDoVendorNameField !== undefined) {
      tenant.externalDbDoVendorNameField =
        updateDto.externalDbDoVendorNameField;
    }
    // Material join configuration for DO items
    if (updateDto.externalDbDoItemMaterialTable !== undefined) {
      tenant.externalDbDoItemMaterialTable =
        updateDto.externalDbDoItemMaterialTable;
    }
    if (updateDto.externalDbDoItemMaterialFk !== undefined) {
      tenant.externalDbDoItemMaterialFk = updateDto.externalDbDoItemMaterialFk;
    }
    if (updateDto.externalDbDoItemMaterialPk !== undefined) {
      tenant.externalDbDoItemMaterialPk = updateDto.externalDbDoItemMaterialPk;
    }
    if (updateDto.externalDbDoItemMaterialNameField !== undefined) {
      tenant.externalDbDoItemMaterialNameField =
        updateDto.externalDbDoItemMaterialNameField;
    }
    // Transporter configuration
    if (updateDto.externalDbTransporterTable !== undefined) {
      tenant.externalDbTransporterTable = updateDto.externalDbTransporterTable;
    }
    if (updateDto.externalDbTransporterMappings !== undefined) {
      tenant.externalDbTransporterMappings =
        updateDto.externalDbTransporterMappings;
    }

    tenant.updatedBy = userId;

    // Save the updated tenant
    await this.tenantRepository.save(tenant);

    // Invalidate cache and refresh connection pool if config changed
    this.cacheService.invalidateTenant(id);
    if (this.externalConnectionService.hasConnection(id)) {
      await this.externalConnectionService.closeConnection(id);
    }

    return this.getExternalDbConfig(id);
  }

  /**
   * Test external database connection for a tenant
   */
  async testExternalDbConnection(
    id: number
  ): Promise<{ success: boolean; message: string }> {
    const tenant = await this.findOne(id);

    // Validate required fields
    if (
      !tenant.externalDbHost ||
      !tenant.externalDbName ||
      !tenant.externalDbUsername ||
      !tenant.externalDbPassword
    ) {
      throw new BadRequestException(
        "External database configuration is incomplete. Please provide host, database name, username, and password."
      );
    }

    try {
      const decryptedPassword = this.encryptionService.decrypt(
        tenant.externalDbPassword
      );

      await this.externalConnectionService.testConnection({
        host: tenant.externalDbHost,
        port: tenant.externalDbPort || 3306,
        database: tenant.externalDbName,
        username: tenant.externalDbUsername,
        password: decryptedPassword,
      });

      return {
        success: true,
        message: "Connection successful",
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }
}
