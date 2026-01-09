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

async function addTransporterPermissions() {
  try {
    await dataSource.initialize();
    console.log("Database connected");

    // Get Transporter module ID
    const transporterModule = await dataSource.query(
      "SELECT id FROM modules WHERE code = 'Transporter'"
    );

    if (transporterModule.length === 0) {
      console.log(
        "Transporter module not found. Please run seed-master-data first."
      );
      await dataSource.destroy();
      return;
    }

    const moduleId = transporterModule[0].id;
    console.log(`Transporter module ID: ${moduleId}`);

    // Get all operations
    const operations = await dataSource.query(
      "SELECT id, code FROM operations"
    );
    console.log(`Found ${operations.length} operations`);

    // Get all Admin roles (for all tenants)
    const adminRoles = await dataSource.query(
      "SELECT id, tenant_id FROM roles WHERE name = 'Admin'"
    );
    console.log(`Found ${adminRoles.length} Admin roles`);

    // For each Admin role, add Transporter permissions
    for (const role of adminRoles) {
      console.log(
        `\nProcessing Admin role ID ${role.id} for tenant ${role.tenant_id}`
      );

      for (const op of operations) {
        const permCode = `Transporter:${op.code}`;

        // Get permission ID
        const permission = await dataSource.query(
          "SELECT id FROM permissions WHERE code = ?",
          [permCode]
        );

        if (permission.length === 0) {
          console.log(`  Permission ${permCode} not found, creating...`);
          // Create the permission
          const result = await dataSource.query(
            `INSERT INTO permissions (module_id, operation_id, code, created_at, updated_at) 
             VALUES (?, ?, ?, NOW(), NOW())`,
            [moduleId, op.id, permCode]
          );
          const permId = result.insertId;

          // Add to role
          await dataSource.query(
            "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
            [role.id, permId]
          );
          console.log(`  Created and assigned permission ${permCode}`);
        } else {
          const permId = permission[0].id;

          // Check if already assigned
          const existing = await dataSource.query(
            "SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?",
            [role.id, permId]
          );

          if (existing.length === 0) {
            await dataSource.query(
              "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
              [role.id, permId]
            );
            console.log(`  Assigned permission ${permCode}`);
          } else {
            console.log(`  Permission ${permCode} already assigned`);
          }
        }
      }
    }

    console.log("\n=== Transporter Permissions Added Successfully ===");
    await dataSource.destroy();
  } catch (error) {
    console.error("Error adding transporter permissions:", error);
    process.exit(1);
  }
}

addTransporterPermissions();
