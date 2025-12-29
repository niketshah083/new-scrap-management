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

async function seedDefaultRoles() {
  try {
    await dataSource.initialize();
    console.log("Database connected");

    // Get all permissions
    const permissions = await dataSource.query("SELECT id FROM permissions");
    console.log(`Found ${permissions.length} permissions`);

    // Create "Tenant Admin" default role (tenant_id = NULL means system-wide default role)
    const existingRole = await dataSource.query(
      "SELECT id FROM roles WHERE name = ? AND tenant_id IS NULL",
      ["Tenant Admin"]
    );

    let roleId: number;

    if (existingRole.length > 0) {
      roleId = existingRole[0].id;
      console.log(`Default role "Tenant Admin" already exists (ID: ${roleId})`);
    } else {
      const result = await dataSource.query(
        `INSERT INTO roles (tenant_id, name, description, is_default, is_active, created_at, updated_at) 
         VALUES (NULL, ?, ?, ?, ?, NOW(), NOW())`,
        [
          "Tenant Admin",
          "Default tenant administrator role with all permissions",
          true,
          true,
        ]
      );
      roleId = result.insertId;
      console.log(`Created default role "Tenant Admin" (ID: ${roleId})`);
    }

    // Clear existing role permissions
    await dataSource.query("DELETE FROM role_permissions WHERE role_id = ?", [
      roleId,
    ]);

    // Assign all permissions to Tenant Admin role
    for (const perm of permissions) {
      await dataSource.query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
        [roleId, perm.id]
      );
    }
    console.log(
      `Assigned ${permissions.length} permissions to "Tenant Admin" role`
    );

    console.log("\n=== Default Roles Seeding Complete ===");

    await dataSource.destroy();
  } catch (error) {
    console.error("Error seeding default roles:", error);
    process.exit(1);
  }
}

seedDefaultRoles();
