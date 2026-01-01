import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../../entities/user.entity";
import { Module } from "../../entities/module.entity";
import { Operation } from "../../entities/operation.entity";
import { Permission } from "../../entities/permission.entity";
import { Role } from "../../entities/role.entity";
import { Plan } from "../../entities/plan.entity";
import { Tenant } from "../../entities/tenant.entity";
import { Subscription } from "../../entities/subscription.entity";
import { GRNFieldConfig } from "../../entities/grn-field-config.entity";
import { GRNFieldConfigService } from "../grn-field-config/grn-field-config.service";
import { ModuleCode, ModuleDefinitions } from "../../common/enums/modules.enum";
import {
  OperationCode,
  OperationDefinitions,
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
    private roleRepository: Repository<Role>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(GRNFieldConfig)
    private grnFieldConfigRepository: Repository<GRNFieldConfig>,
    private grnFieldConfigService: GRNFieldConfigService
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

    // 6. Seed Default Plans
    details.plans = await this.seedPlans();

    // 7. Seed Sample Tenant
    details.tenant = await this.seedSampleTenant();

    // 8. Seed GRN Field Configs for sample tenant
    details.grnFieldConfigs = await this.seedGRNFieldConfigs();

    return {
      message: "Seeding completed successfully",
      details,
    };
  }

  /**
   * Migrate permissions from old UPPERCASE format to new PascalCase format
   * This updates all existing permissions, modules, operations, and role assignments
   */
  async migratePermissions(): Promise<{
    message: string;
    details: Record<string, string>;
  }> {
    const details: Record<string, string> = {};

    // 1. Clear role_permissions junction table first (foreign key constraint)
    await this.roleRepository.query("DELETE FROM role_permissions");
    details.clearedRolePermissions = "Cleared role_permissions junction table";

    // 2. Clear plan_modules junction table (foreign key constraint)
    await this.planRepository.query("DELETE FROM plan_modules");
    details.clearedPlanModules = "Cleared plan_modules junction table";

    // 3. Delete all existing permissions (they have old format codes)
    const deletedPermissions = await this.permissionRepository.count();
    await this.permissionRepository.query("DELETE FROM permissions");
    details.deletedPermissions = `Deleted ${deletedPermissions} old permissions`;

    // 4. Delete all existing operations
    const deletedOperations = await this.operationRepository.count();
    await this.operationRepository.query("DELETE FROM operations");
    details.deletedOperations = `Deleted ${deletedOperations} old operations`;

    // 5. Delete all existing modules
    const deletedModules = await this.moduleRepository.count();
    await this.moduleRepository.query("DELETE FROM modules");
    details.deletedModules = `Deleted ${deletedModules} old modules`;

    // 6. Re-seed modules with new format
    details.modules = await this.seedModules();

    // 7. Re-seed operations with new format
    details.operations = await this.seedOperations();

    // 8. Re-seed permissions with new format
    details.permissions = await this.seedPermissions();

    // 9. Update all roles to have new permissions
    details.roles = await this.updateAllRolesPermissions();

    // 10. Re-seed plans with modules
    details.plans = await this.seedPlans();

    return {
      message: "Permission migration completed successfully",
      details,
    };
  }

  /**
   * Update all roles to have the new PascalCase permissions
   */
  private async updateAllRolesPermissions(): Promise<string> {
    const allPermissions = await this.permissionRepository.find();
    const roles = await this.roleRepository.find();

    let updated = 0;
    for (const role of roles) {
      // Assign all permissions to each role (you may want to customize this)
      role.permissions = allPermissions;
      await this.roleRepository.save(role);
      updated++;
    }

    return `Updated ${updated} roles with ${allPermissions.length} new permissions each`;
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

  private async seedPlans(): Promise<string> {
    const results: string[] = [];

    // 1. Basic Plan
    const basicResult = await this.createPlan({
      name: "Basic",
      description: "Basic plan with essential features for small businesses",
      price: 99.0,
      billingCycle: "monthly",
      moduleCodes: [
        ModuleCode.Dashboard,
        ModuleCode.Vendor,
        ModuleCode.Material,
        ModuleCode.PurchaseOrder,
        ModuleCode.GRN,
        ModuleCode.GatePass,
      ],
    });
    results.push(`Basic Plan: ${basicResult}`);

    // 2. Professional Plan
    const proResult = await this.createPlan({
      name: "Professional",
      description:
        "Professional plan with QC and reporting features for growing businesses",
      price: 199.0,
      billingCycle: "monthly",
      moduleCodes: [
        ModuleCode.Dashboard,
        ModuleCode.Vendor,
        ModuleCode.Material,
        ModuleCode.PurchaseOrder,
        ModuleCode.GRN,
        ModuleCode.GRNFieldConfig,
        ModuleCode.QC,
        ModuleCode.GatePass,
        ModuleCode.Report,
        ModuleCode.User,
        ModuleCode.Role,
      ],
    });
    results.push(`Professional Plan: ${proResult}`);

    // 3. Enterprise Plan
    const enterpriseResult = await this.createPlan({
      name: "Enterprise",
      description:
        "Enterprise plan with all features including external DB integration",
      price: 499.0,
      billingCycle: "monthly",
      moduleCodes: Object.values(ModuleCode), // All modules
    });
    results.push(`Enterprise Plan: ${enterpriseResult}`);

    return results.join("; ");
  }

  private async createPlan(planData: {
    name: string;
    description: string;
    price: number;
    billingCycle: string;
    moduleCodes: ModuleCode[];
  }): Promise<string> {
    const existingPlan = await this.planRepository.findOne({
      where: { name: planData.name },
      relations: ["modules"],
    });

    // Get modules for this plan
    const modules = await this.moduleRepository.find({
      where: planData.moduleCodes.map((code) => ({ code })),
    });

    if (existingPlan) {
      // Update existing plan with new modules
      existingPlan.modules = modules;
      await this.planRepository.save(existingPlan);
      return `updated (ID: ${existingPlan.id}) with ${modules.length} modules`;
    }

    const plan = this.planRepository.create({
      name: planData.name,
      description: planData.description,
      price: planData.price,
      billingCycle: planData.billingCycle,
      isActive: true,
      modules,
    });

    const saved = await this.planRepository.save(plan);
    return `created (ID: ${saved.id}) with ${modules.length} modules`;
  }

  private async seedSampleTenant(): Promise<string> {
    const email = "demo@scrapcompany.com";

    const existingTenant = await this.tenantRepository.findOne({
      where: { email },
    });

    if (existingTenant) {
      return `Sample tenant already exists (ID: ${existingTenant.id})`;
    }

    // Create tenant
    const tenant = this.tenantRepository.create({
      companyName: "Demo Scrap Company",
      email,
      phone: "+1234567890",
      address: "123 Industrial Park, Demo City, DC 12345",
      isActive: true,
      externalDbEnabled: false,
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Create subscription for tenant (Enterprise plan)
    const enterprisePlan = await this.planRepository.findOne({
      where: { name: "Enterprise" },
    });

    if (enterprisePlan) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

      const subscription = this.subscriptionRepository.create({
        tenantId: savedTenant.id,
        planId: enterprisePlan.id,
        startDate,
        endDate,
        status: "active",
      });

      await this.subscriptionRepository.save(subscription);
    }

    // Create tenant admin role
    const allPermissions = await this.permissionRepository.find();
    const tenantAdminRole = this.roleRepository.create({
      name: "Admin",
      description: "Tenant administrator with all permissions",
      tenantId: savedTenant.id,
      isDefault: false,
      isActive: true,
      permissions: allPermissions,
    });

    const savedRole = await this.roleRepository.save(tenantAdminRole);

    // Create tenant admin user
    const hashedPassword = await bcrypt.hash("Demo@123", 10);
    const tenantAdmin = this.userRepository.create({
      name: "Demo Admin",
      email: "admin@demo.com",
      password: hashedPassword,
      tenantId: savedTenant.id,
      roleId: savedRole.id,
      isSuperAdmin: false,
      isActive: true,
    });

    await this.userRepository.save(tenantAdmin);

    return `Created sample tenant (ID: ${savedTenant.id}, Company: Demo Scrap Company) with admin user (Email: admin@demo.com, Password: Demo@123)`;
  }

  private async seedGRNFieldConfigs(): Promise<string> {
    // Find the sample tenant
    const tenant = await this.tenantRepository.findOne({
      where: { email: "demo@scrapcompany.com" },
    });

    if (!tenant) {
      return "Skipped - sample tenant not found";
    }

    // Check if configs already exist for this tenant
    const existingConfigs = await this.grnFieldConfigRepository.count({
      where: { tenantId: tenant.id },
    });

    if (existingConfigs > 0) {
      return `GRN field configs already exist for tenant (${existingConfigs} configs)`;
    }

    // Use the GRNFieldConfigService to create default fields
    // This ensures consistency with tenant creation flow
    const createdFields =
      await this.grnFieldConfigService.createDefaultFieldsForTenant(
        tenant.id,
        1 // System user ID
      );

    return `Created ${createdFields.length} GRN field configs for sample tenant`;
  }
}
