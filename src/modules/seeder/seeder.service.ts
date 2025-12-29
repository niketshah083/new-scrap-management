import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../../entities/user.entity";
import { Module } from "../../entities/module.entity";
import { Operation } from "../../entities/operation.entity";
import { Permission } from "../../entities/permission.entity";
import { Role } from "../../entities/role.entity";
import { ModuleCode, ModuleDefinitions } from "../../common/enums/modules.enum";
import {
  OperationCode,
  OperationDefinitions,
  GRN_STEP_OPERATIONS,
  STANDARD_OPERATIONS,
} from "../../common/enums/operations.enum";

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(Operation)
    private operationRepository: Repository<Operation>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>
  ) {}

  async seedAll(): Promise<{
    message: string;
    details: Record<string, string>;
  }> {
    const details: Record<string, string> = {};

    // 1. Seed Super Admin
    details.superAdmin = await this.seedSuperAdmin();

    // 2. Seed Modules
    details.modules = await this.seedModules();

    // 3. Seed Operations
    details.operations = await this.seedOperations();

    // 4. Seed Permissions
    details.permissions = await this.seedPermissions();

    // 5. Seed Default Roles
    details.defaultRoles = await this.seedDefaultRoles();

    return {
      message: "Seeding completed successfully",
      details,
    };
  }

  private async seedSuperAdmin(): Promise<string> {
    const email = "admin@scrap.com";

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      return `Super admin already exists (ID: ${existingUser.id})`;
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    const superAdmin = this.userRepository.create({
      name: "Super Admin",
      email,
      password: hashedPassword,
      isSuperAdmin: true,
      isActive: true,
    });

    const saved = await this.userRepository.save(superAdmin);
    return `Created super admin (ID: ${saved.id}, Email: ${email}, Password: Admin@123)`;
  }

  private async seedModules(): Promise<string> {
    let created = 0;
    let existing = 0;

    for (const code of Object.values(ModuleCode)) {
      const definition = ModuleDefinitions[code];

      const existingModule = await this.moduleRepository.findOne({
        where: { code },
      });

      if (existingModule) {
        existing++;
        continue;
      }

      const module = this.moduleRepository.create({
        name: definition.name,
        code,
        description: definition.description,
        isActive: true,
      });

      await this.moduleRepository.save(module);
      created++;
    }

    return `Modules: ${created} created, ${existing} already existed`;
  }

  private async seedOperations(): Promise<string> {
    let created = 0;
    let existing = 0;

    for (const code of Object.values(OperationCode)) {
      const definition = OperationDefinitions[code];

      const existingOperation = await this.operationRepository.findOne({
        where: { code },
      });

      if (existingOperation) {
        existing++;
        continue;
      }

      const operation = this.operationRepository.create({
        name: definition.name,
        code,
      });

      await this.operationRepository.save(operation);
      created++;
    }

    return `Operations: ${created} created, ${existing} already existed`;
  }

  private async seedPermissions(): Promise<string> {
    let created = 0;
    let existing = 0;

    const modules = await this.moduleRepository.find();
    const operations = await this.operationRepository.find();

    for (const module of modules) {
      // Determine which operations apply to this module
      let applicableOperations: Operation[];

      if (module.code === ModuleCode.GRN) {
        // GRN module gets both standard operations AND step-wise operations
        applicableOperations = operations;
      } else {
        // Other modules only get standard operations (no step-wise operations)
        applicableOperations = operations.filter((op) =>
          STANDARD_OPERATIONS.includes(op.code as OperationCode)
        );
      }

      for (const operation of applicableOperations) {
        const code = `${module.code}:${operation.code}`;

        const existingPermission = await this.permissionRepository.findOne({
          where: { code },
        });

        if (existingPermission) {
          existing++;
          continue;
        }

        const permission = this.permissionRepository.create({
          moduleId: module.id,
          operationId: operation.id,
          code,
        });

        await this.permissionRepository.save(permission);
        created++;
      }
    }

    return `Permissions: ${created} created, ${existing} already existed`;
  }

  private async seedDefaultRoles(): Promise<string> {
    const results: string[] = [];

    // Get all permissions for assigning to roles
    const allPermissions = await this.permissionRepository.find();

    // 1. Super Admin Default Role (for system-wide use)
    const superAdminResult = await this.createDefaultRole(
      "Super Admin",
      "Default super admin role with all permissions",
      true,
      allPermissions
    );
    results.push(`Super Admin Role: ${superAdminResult}`);

    // 2. Tenant Admin Default Role (for tenant administrators)
    const tenantAdminResult = await this.createDefaultRole(
      "Tenant Admin",
      "Default tenant administrator role with all permissions",
      true,
      allPermissions
    );
    results.push(`Tenant Admin Role: ${tenantAdminResult}`);

    return results.join("; ");
  }

  private async createDefaultRole(
    name: string,
    description: string,
    isDefault: boolean,
    permissions: Permission[]
  ): Promise<string> {
    // Check if role already exists (tenant_id IS NULL for default roles)
    const existingRole = await this.roleRepository.findOne({
      where: { name, tenantId: IsNull() },
    });

    if (existingRole) {
      return `already exists (ID: ${existingRole.id})`;
    }

    // Create the role
    const role = this.roleRepository.create({
      name,
      description,
      isDefault,
      isActive: true,
      tenantId: null as any,
      permissions,
    });

    const saved = await this.roleRepository.save(role);
    return `created (ID: ${saved.id}) with ${permissions.length} permissions`;
  }
}
