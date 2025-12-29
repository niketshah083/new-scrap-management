import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
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

async function seedSuperAdmin() {
  try {
    await dataSource.initialize();
    console.log("Database connected");

    const email = "admin@scrap.com";
    const password = "Admin@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if super admin already exists
    const existingUser = await dataSource.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      console.log("Super admin already exists");
      await dataSource.destroy();
      return;
    }

    // Insert super admin
    await dataSource.query(
      `INSERT INTO users (name, email, password, is_super_admin, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      ["Super Admin", email, hashedPassword, true, true]
    );

    console.log("Super admin created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);

    await dataSource.destroy();
  } catch (error) {
    console.error("Error seeding super admin:", error);
    process.exit(1);
  }
}

seedSuperAdmin();
