import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Role } from "../../entities/role.entity";
import { Permission } from "../../entities/permission.entity";
import { Subscription } from "../../entities/subscription.entity";
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from "./dto";

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>
  ) {}

  async create(
    tenantId: number,
    createDto: CreateRoleDto,
    userId: number
  ): Promise<Role> {
    const role = this.roleRepository.create({
      tenantId,
      name: createDto.name,
      description: createDto.description,
      createdBy: userId,
      updatedBy: userId,
    });

    // If permission IDs provided, validate and assign
    if (createDto.permissionIds && createDto.permissionIds.length > 0) {
      const validPermissions = await this.getValidPermissionsForTenant(
        tenantId,
        createDto.permissionIds
      );
      role.permissions = validPermissions;
    }

    return this.roleRepository.save(role);
  }

  async findAll(tenantId: number): Promise<Role[]> {
    return this.roleRepository.find({
      where: { tenantId },
      relations: ["permissions"],
      order: { name: "ASC" },
    });
  }

  async findOne(tenantId: number, id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, tenantId },
      relations: ["permissions", "permissions.module", "permissions.operation"],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async update(
    tenantId: number,
    id: number,
    updateDto: UpdateRoleDto,
    userId: number
  ): Promise<Role> {
    const role = await this.findOne(tenantId, id);

    Object.assign(role, updateDto);
    role.updatedBy = userId;

    return this.roleRepository.save(role);
  }

  async assignPermissions(
    tenantId: number,
    id: number,
    assignDto: AssignPermissionsDto,
    userId: number
  ): Promise<Role> {
    const role = await this.findOne(tenantId, id);

    const validPermissions = await this.getValidPermissionsForTenant(
      tenantId,
      assignDto.permissionIds
    );

    role.permissions = validPermissions;
    role.updatedBy = userId;

    return this.roleRepository.save(role);
  }

  async remove(tenantId: number, id: number, userId: number): Promise<void> {
    const role = await this.findOne(tenantId, id);

    role.deletedBy = userId;
    await this.roleRepository.save(role);

    await this.roleRepository.softRemove(role);
  }

  // Get permissions that are valid for the tenant's plan
  private async getValidPermissionsForTenant(
    tenantId: number,
    permissionIds: number[]
  ): Promise<Permission[]> {
    // Get tenant's active subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId, status: "active" },
      relations: ["plan", "plan.modules"],
    });

    if (!subscription) {
      throw new BadRequestException(
        "Tenant does not have an active subscription"
      );
    }

    // Get module IDs from the plan
    const planModuleIds = subscription.plan.modules.map((m) => m.id);

    // Get all requested permissions
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
      relations: ["module"],
    });

    // Filter permissions to only those whose module is in the plan
    const validPermissions = permissions.filter((p) =>
      planModuleIds.includes(p.moduleId)
    );

    if (validPermissions.length !== permissionIds.length) {
      const invalidCount = permissionIds.length - validPermissions.length;
      throw new BadRequestException(
        `${invalidCount} permission(s) are not available in your plan`
      );
    }

    return validPermissions;
  }

  // Get available permissions for tenant based on plan
  async getAvailablePermissions(tenantId: number): Promise<Permission[]> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId, status: "active" },
      relations: ["plan", "plan.modules"],
    });

    if (!subscription) {
      return [];
    }

    const planModuleIds = subscription.plan.modules.map((m) => m.id);

    return this.permissionRepository.find({
      where: { moduleId: In(planModuleIds) },
      relations: ["module", "operation"],
      order: { code: "ASC" },
    });
  }
}
