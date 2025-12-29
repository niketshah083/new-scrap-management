import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { Module } from "../../entities/module.entity";
import { Operation } from "../../entities/operation.entity";
import { Permission } from "../../entities/permission.entity";
import { Role } from "../../entities/role.entity";
import {
  CreateModuleDto,
  UpdateModuleDto,
  CreateOperationDto,
  UpdateOperationDto,
  CreateDefaultRoleDto,
  UpdateDefaultRoleDto,
} from "./dto";

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(Operation)
    private operationRepository: Repository<Operation>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>
  ) {}

  // Modules
  async findAllModules(): Promise<Module[]> {
    return this.moduleRepository.find({
      order: { name: "ASC" },
    });
  }

  async findOneModule(id: number): Promise<Module> {
    const module = await this.moduleRepository.findOne({ where: { id } });
    if (!module) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }
    return module;
  }

  async createModule(dto: CreateModuleDto, userId: number): Promise<Module> {
    const module = this.moduleRepository.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.moduleRepository.save(module);
  }

  async updateModule(
    id: number,
    dto: UpdateModuleDto,
    userId: number
  ): Promise<Module> {
    const module = await this.findOneModule(id);
    Object.assign(module, { ...dto, updatedBy: userId });
    return this.moduleRepository.save(module);
  }

  async deleteModule(id: number, userId: number): Promise<void> {
    const module = await this.findOneModule(id);
    module.deletedBy = userId;
    await this.moduleRepository.save(module);
    await this.moduleRepository.softRemove(module);
  }

  async toggleModuleStatus(id: number, userId: number): Promise<Module> {
    const module = await this.findOneModule(id);
    module.isActive = !module.isActive;
    module.updatedBy = userId;
    return this.moduleRepository.save(module);
  }

  // Operations
  async findAllOperations(): Promise<Operation[]> {
    return this.operationRepository.find({
      order: { name: "ASC" },
    });
  }

  async findOneOperation(id: number): Promise<Operation> {
    const operation = await this.operationRepository.findOne({ where: { id } });
    if (!operation) {
      throw new NotFoundException(`Operation with ID ${id} not found`);
    }
    return operation;
  }

  async createOperation(
    dto: CreateOperationDto,
    userId: number
  ): Promise<Operation> {
    const operation = this.operationRepository.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.operationRepository.save(operation);
  }

  async updateOperation(
    id: number,
    dto: UpdateOperationDto,
    userId: number
  ): Promise<Operation> {
    const operation = await this.findOneOperation(id);
    Object.assign(operation, { ...dto, updatedBy: userId });
    return this.operationRepository.save(operation);
  }

  async deleteOperation(id: number, userId: number): Promise<void> {
    const operation = await this.findOneOperation(id);
    operation.deletedBy = userId;
    await this.operationRepository.save(operation);
    await this.operationRepository.softRemove(operation);
  }

  // Permissions
  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      relations: ["module", "operation"],
      order: { code: "ASC" },
    });
  }

  // Default Roles (roles without tenant_id - system-wide roles)
  async findAllDefaultRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { tenantId: IsNull() },
      relations: ["permissions", "permissions.module", "permissions.operation"],
      order: { name: "ASC" },
    });
  }

  async findOneDefaultRole(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, tenantId: IsNull() },
      relations: ["permissions", "permissions.module", "permissions.operation"],
    });
    if (!role) {
      throw new NotFoundException(`Default role with ID ${id} not found`);
    }
    return role;
  }

  async createDefaultRole(
    dto: CreateDefaultRoleDto,
    userId: number
  ): Promise<Role> {
    const { permissionIds, ...roleData } = dto;

    const role = this.roleRepository.create({
      ...roleData,
      tenantId: null as any, // System-wide role
      createdBy: userId,
      updatedBy: userId,
    });

    if (permissionIds && permissionIds.length > 0) {
      const permissions =
        await this.permissionRepository.findByIds(permissionIds);
      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async updateDefaultRole(
    id: number,
    dto: UpdateDefaultRoleDto,
    userId: number
  ): Promise<Role> {
    const role = await this.findOneDefaultRole(id);
    const { permissionIds, ...roleData } = dto;

    Object.assign(role, { ...roleData, updatedBy: userId });

    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        const permissions =
          await this.permissionRepository.findByIds(permissionIds);
        role.permissions = permissions;
      } else {
        role.permissions = [];
      }
    }

    return this.roleRepository.save(role);
  }

  async deleteDefaultRole(id: number, userId: number): Promise<void> {
    const role = await this.findOneDefaultRole(id);
    role.deletedBy = userId;
    await this.roleRepository.save(role);
    await this.roleRepository.softRemove(role);
  }

  async toggleDefaultRoleStatus(id: number, userId: number): Promise<Role> {
    const role = await this.findOneDefaultRole(id);
    role.isActive = !role.isActive;
    role.updatedBy = userId;
    return this.roleRepository.save(role);
  }
}
