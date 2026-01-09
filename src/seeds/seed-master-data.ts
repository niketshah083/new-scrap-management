import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

const dataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Module definitions
const modules = [
  {
    name: "Dashboard",
    code: "DASHBOARD",
    description: "Dashboard and analytics",
  },
  { name: "Vendors", code: "VENDORS", description: "Vendor management" },
  { name: "Materials", code: "MATERIALS", description: "Material management" },
  {
    name: "Purchase Orders",
    code: "PURCHASE_ORDERS",
    description: "Purchase order management",
  },
  { name: "GRN", code: "GRN", description: "Goods Receipt Note management" },
  {
    name: "GRN Field Config",
    code: "GRNFieldConfig",
    description: "GRN field configuration management",
  },
  {
    name: "Quality Control",
    code: "QC",
    description: "Quality control management",
  },
  { name: "Gate Pass", code: "GATE_PASS", description: "Gate pass management" },
  { name: "Reports", code: "REPORTS", description: "Reports and analytics" },
  { name: "Users", code: "USERS", description: "User management" },
  { name: "Roles", code: "ROLES", description: "Role management" },
  { name: "Settings", code: "SETTINGS", description: "System settings" },
  {
    name: "Transporter",
    code: "Transporter",
    description: "Transporter master management",
  },
];

// Operation definitions
const operations = [
  { name: "Create", code: "CREATE" },
  { name: "Read", code: "READ" },
  { name: "Update", code: "UPDATE" },
  { name: "Delete", code: "DELETE" },
  { name: "List", code: "LIST" },
  { name: "Export", code: "EXPORT" },
  { name: "Import", code: "IMPORT" },
  { name: "Approve", code: "APPROVE" },
];

// Plan definitions
const plans = [
  {
    name: "Basic",
    description: "Basic plan for small businesses",
    price: 99.0,
    billingCycle: "monthly",
    moduleCodes: ["DASHBOARD", "VENDORS", "MATERIALS", "PURCHASE_ORDERS"],
  },
  {
    name: "Standard",
    description: "Standard plan for growing businesses",
    price: 199.0,
    billingCycle: "monthly",
    moduleCodes: [
      "DASHBOARD",
      "VENDORS",
      "MATERIALS",
      "PURCHASE_ORDERS",
      "GRN",
      "QC",
      "GATE_PASS",
    ],
  },
  {
    name: "Enterprise",
    description: "Enterprise plan with all features",
    price: 499.0,
    billingCycle: "monthly",
    moduleCodes: [
      "DASHBOARD",
      "VENDORS",
      "MATERIALS",
      "PURCHASE_ORDERS",
      "GRN",
      "GRNFieldConfig",
      "QC",
      "GATE_PASS",
      "REPORTS",
      "USERS",
      "ROLES",
      "SETTINGS",
      "Transporter",
    ],
  },
];

async function seedMasterData() {
  try {
    await dataSource.initialize();
    console.log("Database connected");

    // 1. Seed Modules
    console.log("\n--- Seeding Modules ---");
    const moduleIds: Record<string, number> = {};

    for (const mod of modules) {
      const existing = await dataSource.query(
        "SELECT id FROM modules WHERE code = ?",
        [mod.code]
      );

      if (existing.length > 0) {
        moduleIds[mod.code] = existing[0].id;
        console.log(
          `Module "${mod.name}" already exists (ID: ${existing[0].id})`
        );
      } else {
        const result = await dataSource.query(
          `INSERT INTO modules (name, code, description, is_active, created_at, updated_at) 
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [mod.name, mod.code, mod.description, true]
        );
        moduleIds[mod.code] = result.insertId;
        console.log(`Created module "${mod.name}" (ID: ${result.insertId})`);
      }
    }

    // 2. Seed Operations
    console.log("\n--- Seeding Operations ---");
    const operationIds: Record<string, number> = {};

    for (const op of operations) {
      const existing = await dataSource.query(
        "SELECT id FROM operations WHERE code = ?",
        [op.code]
      );

      if (existing.length > 0) {
        operationIds[op.code] = existing[0].id;
        console.log(
          `Operation "${op.name}" already exists (ID: ${existing[0].id})`
        );
      } else {
        const result = await dataSource.query(
          `INSERT INTO operations (name, code, created_at, updated_at) 
           VALUES (?, ?, NOW(), NOW())`,
          [op.name, op.code]
        );
        operationIds[op.code] = result.insertId;
        console.log(`Created operation "${op.name}" (ID: ${result.insertId})`);
      }
    }

    // 3. Seed Permissions (Module + Operation combinations)
    console.log("\n--- Seeding Permissions ---");
    const permissionIds: Record<string, number> = {};

    for (const mod of modules) {
      for (const op of operations) {
        const permCode = `${mod.code}:${op.code}`;
        const existing = await dataSource.query(
          "SELECT id FROM permissions WHERE code = ?",
          [permCode]
        );

        if (existing.length > 0) {
          permissionIds[permCode] = existing[0].id;
        } else {
          const result = await dataSource.query(
            `INSERT INTO permissions (module_id, operation_id, code, created_at, updated_at) 
             VALUES (?, ?, ?, NOW(), NOW())`,
            [moduleIds[mod.code], operationIds[op.code], permCode]
          );
          permissionIds[permCode] = result.insertId;
        }
      }
    }
    console.log(
      `Created/verified ${Object.keys(permissionIds).length} permissions`
    );

    // 4. Seed Plans
    console.log("\n--- Seeding Plans ---");
    const planIds: Record<string, number> = {};

    for (const plan of plans) {
      const existing = await dataSource.query(
        "SELECT id FROM plans WHERE name = ?",
        [plan.name]
      );

      let planId: number;
      if (existing.length > 0) {
        planId = existing[0].id;
        planIds[plan.name] = planId;
        console.log(`Plan "${plan.name}" already exists (ID: ${planId})`);
      } else {
        const result = await dataSource.query(
          `INSERT INTO plans (name, description, price, billing_cycle, is_active, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [plan.name, plan.description, plan.price, plan.billingCycle, true]
        );
        planId = result.insertId;
        planIds[plan.name] = planId;
        console.log(`Created plan "${plan.name}" (ID: ${planId})`);
      }

      // Link plan to modules
      for (const moduleCode of plan.moduleCodes) {
        const moduleId = moduleIds[moduleCode];
        const existingLink = await dataSource.query(
          "SELECT * FROM plan_modules WHERE plan_id = ? AND module_id = ?",
          [planId, moduleId]
        );

        if (existingLink.length === 0) {
          await dataSource.query(
            "INSERT INTO plan_modules (plan_id, module_id) VALUES (?, ?)",
            [planId, moduleId]
          );
        }
      }
    }

    // 5. Seed Sample Tenant
    console.log("\n--- Seeding Sample Tenant ---");
    let tenantId: number;

    const existingTenant = await dataSource.query(
      "SELECT id FROM tenants WHERE email = ?",
      ["demo@scrapyard.com"]
    );

    if (existingTenant.length > 0) {
      tenantId = existingTenant[0].id;
      console.log(`Tenant "Demo Scrapyard" already exists (ID: ${tenantId})`);
    } else {
      const result = await dataSource.query(
        `INSERT INTO tenants (company_name, email, phone, address, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          "Demo Scrapyard",
          "demo@scrapyard.com",
          "1234567890",
          "123 Demo Street, Demo City",
          true,
        ]
      );
      tenantId = result.insertId;
      console.log(`Created tenant "Demo Scrapyard" (ID: ${tenantId})`);
    }

    // 6. Seed Subscription for Tenant
    console.log("\n--- Seeding Subscription ---");
    const existingSubscription = await dataSource.query(
      "SELECT id FROM subscriptions WHERE tenant_id = ?",
      [tenantId]
    );

    if (existingSubscription.length > 0) {
      console.log(
        `Subscription for tenant already exists (ID: ${existingSubscription[0].id})`
      );
    } else {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

      const result = await dataSource.query(
        `INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          tenantId,
          planIds["Enterprise"],
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0],
          "active",
        ]
      );
      console.log(
        `Created subscription (ID: ${result.insertId}) - Enterprise plan for 1 year`
      );
    }

    // 7. Seed Default Admin Role for Tenant
    console.log("\n--- Seeding Default Admin Role ---");
    const existingRole = await dataSource.query(
      "SELECT id FROM roles WHERE tenant_id = ? AND name = ?",
      [tenantId, "Admin"]
    );

    let roleId: number;
    if (existingRole.length > 0) {
      roleId = existingRole[0].id;
      console.log(`Admin role already exists (ID: ${roleId})`);
    } else {
      const result = await dataSource.query(
        `INSERT INTO roles (tenant_id, name, description, is_default, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [tenantId, "Admin", "Administrator with full access", true, true]
      );
      roleId = result.insertId;
      console.log(`Created Admin role (ID: ${roleId})`);

      // Assign all permissions to Admin role
      for (const permCode of Object.keys(permissionIds)) {
        await dataSource.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
          [roleId, permissionIds[permCode]]
        );
      }
      console.log(`Assigned all permissions to Admin role`);
    }

    console.log("\n=== Master Data Seeding Complete ===");
    console.log("\nSummary:");
    console.log(`- Modules: ${modules.length}`);
    console.log(`- Operations: ${operations.length}`);
    console.log(`- Permissions: ${Object.keys(permissionIds).length}`);
    console.log(`- Plans: ${plans.length} (Basic, Standard, Enterprise)`);
    console.log(`- Sample Tenant: Demo Scrapyard (demo@scrapyard.com)`);
    console.log(`- Subscription: Enterprise plan (1 year)`);
    console.log(`- Default Role: Admin (with all permissions)`);

    await dataSource.destroy();
  } catch (error) {
    console.error("Error seeding master data:", error);
    process.exit(1);
  }
}

seedMasterData();
