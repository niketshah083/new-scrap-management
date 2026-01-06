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

// Device-related module definitions
const deviceModules = [
  {
    name: "Weighbridge",
    code: "Weighbridge",
    description: "Weighbridge device management and configuration",
  },
  {
    name: "Camera",
    code: "Camera",
    description: "Camera device management and configuration",
  },
];

// Sample weighbridge masters
const sampleWeighbridges = [
  {
    name: "Main Gate Weighbridge",
    code: "WB-001",
    location: "Main Gate",
    description: "Primary weighbridge at main entrance",
    isActive: true,
  },
  {
    name: "Loading Bay Weighbridge",
    code: "WB-002",
    location: "Loading Bay A",
    description: "Weighbridge for loading bay operations",
    isActive: true,
  },
  {
    name: "Exit Gate Weighbridge",
    code: "WB-003",
    location: "Exit Gate",
    description: "Weighbridge at exit for final weight verification",
    isActive: false,
  },
];

// Sample camera masters
const sampleCameras = [
  {
    name: "Main Gate Camera",
    code: "CAM-001",
    location: "Main Gate",
    description: "CCTV camera at main entrance",
    cameraType: "RTSP",
    isActive: true,
  },
  {
    name: "Weighbridge Camera 1",
    code: "CAM-002",
    location: "Weighbridge WB-001",
    description: "Camera monitoring main weighbridge",
    cameraType: "RTSP",
    isActive: true,
  },
  {
    name: "Loading Bay Camera",
    code: "CAM-003",
    location: "Loading Bay A",
    description: "Camera monitoring loading bay operations",
    cameraType: "IP",
    isActive: true,
  },
  {
    name: "Exit Gate Camera",
    code: "CAM-004",
    location: "Exit Gate",
    description: "Camera at exit gate",
    cameraType: "RTSP",
    isActive: false,
  },
];

// Sample weighbridge configurations
const sampleWeighbridgeConfigs = [
  {
    weighbridgeCode: "WB-001",
    serialPort: "COM1",
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: "none",
    weightRegex: "\\d+\\.?\\d*",
    weightStartMarker: "W:",
    weightEndMarker: "kg",
    weightMultiplier: 1,
    weightUnit: "kg",
    pollingInterval: 500,
    stableReadings: 3,
    stabilityThreshold: 0.5,
    isActive: true,
  },
  {
    weighbridgeCode: "WB-002",
    serialPort: "COM2",
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: "none",
    weightRegex: "\\d+\\.?\\d*",
    weightStartMarker: "",
    weightEndMarker: "",
    weightMultiplier: 1,
    weightUnit: "kg",
    pollingInterval: 500,
    stableReadings: 3,
    stabilityThreshold: 0.5,
    isActive: true,
  },
];

// Sample camera configurations
const sampleCameraConfigs = [
  {
    cameraCode: "CAM-001",
    rtspUrl: "rtsp://192.168.1.100:554/stream1",
    streamUrl: "",
    username: "admin",
    password: "admin123",
    snapshotWidth: 1920,
    snapshotHeight: 1080,
    snapshotQuality: 85,
    transport: "tcp",
    timeout: 5000,
    isActive: true,
  },
  {
    cameraCode: "CAM-002",
    rtspUrl: "rtsp://192.168.1.101:554/stream1",
    streamUrl: "",
    username: "admin",
    password: "admin123",
    snapshotWidth: 1920,
    snapshotHeight: 1080,
    snapshotQuality: 85,
    transport: "tcp",
    timeout: 5000,
    isActive: true,
  },
];

async function seedDeviceData() {
  try {
    await dataSource.initialize();
    console.log("Database connected");

    // Get demo tenant ID
    const tenantResult = await dataSource.query(
      "SELECT id FROM tenants WHERE email = ?",
      ["demo@scrapyard.com"]
    );

    if (tenantResult.length === 0) {
      console.error(
        "Demo tenant not found. Please run seed-master-data first."
      );
      process.exit(1);
    }

    const tenantId = tenantResult[0].id;
    console.log(`Using tenant ID: ${tenantId}`);

    // 1. Seed Device Modules
    console.log("\n--- Seeding Device Modules ---");
    const moduleIds: Record<string, number> = {};

    for (const mod of deviceModules) {
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

    // 2. Seed Permissions for Device Modules
    console.log("\n--- Seeding Device Permissions ---");
    const operations = ["CREATE", "READ", "UPDATE", "DELETE", "LIST"];
    const operationIds: Record<string, number> = {};

    // Get operation IDs
    for (const opCode of operations) {
      const opResult = await dataSource.query(
        "SELECT id FROM operations WHERE code = ?",
        [opCode]
      );
      if (opResult.length > 0) {
        operationIds[opCode] = opResult[0].id;
      }
    }

    // Create permissions for device modules
    for (const mod of deviceModules) {
      for (const opCode of operations) {
        const permCode = `${mod.code}:${opCode}`;
        const existing = await dataSource.query(
          "SELECT id FROM permissions WHERE code = ?",
          [permCode]
        );

        if (existing.length === 0 && operationIds[opCode]) {
          await dataSource.query(
            `INSERT INTO permissions (module_id, operation_id, code, created_at, updated_at) 
             VALUES (?, ?, ?, NOW(), NOW())`,
            [moduleIds[mod.code], operationIds[opCode], permCode]
          );
          console.log(`Created permission: ${permCode}`);
        }
      }
    }

    // 3. Add device modules to Enterprise plan
    console.log("\n--- Adding Device Modules to Enterprise Plan ---");
    const planResult = await dataSource.query(
      "SELECT id FROM plans WHERE name = ?",
      ["Enterprise"]
    );

    if (planResult.length > 0) {
      const planId = planResult[0].id;
      for (const mod of deviceModules) {
        const existingLink = await dataSource.query(
          "SELECT * FROM plan_modules WHERE plan_id = ? AND module_id = ?",
          [planId, moduleIds[mod.code]]
        );

        if (existingLink.length === 0) {
          await dataSource.query(
            "INSERT INTO plan_modules (plan_id, module_id) VALUES (?, ?)",
            [planId, moduleIds[mod.code]]
          );
          console.log(`Added ${mod.name} to Enterprise plan`);
        }
      }
    }

    // 4. Assign device permissions to Admin role
    console.log("\n--- Assigning Device Permissions to Admin Role ---");
    const roleResult = await dataSource.query(
      "SELECT id FROM roles WHERE tenant_id = ? AND name = ?",
      [tenantId, "Admin"]
    );

    if (roleResult.length > 0) {
      const roleId = roleResult[0].id;
      for (const mod of deviceModules) {
        for (const opCode of operations) {
          const permCode = `${mod.code}:${opCode}`;
          const permResult = await dataSource.query(
            "SELECT id FROM permissions WHERE code = ?",
            [permCode]
          );

          if (permResult.length > 0) {
            const existingRolePerm = await dataSource.query(
              "SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?",
              [roleId, permResult[0].id]
            );

            if (existingRolePerm.length === 0) {
              await dataSource.query(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                [roleId, permResult[0].id]
              );
            }
          }
        }
      }
      console.log("Assigned device permissions to Admin role");
    }

    // 5. Seed Weighbridge Masters
    console.log("\n--- Seeding Weighbridge Masters ---");
    const weighbridgeIds: Record<string, number> = {};

    for (const wb of sampleWeighbridges) {
      const existing = await dataSource.query(
        "SELECT id FROM weighbridge_masters WHERE tenant_id = ? AND code = ?",
        [tenantId, wb.code]
      );

      if (existing.length > 0) {
        weighbridgeIds[wb.code] = existing[0].id;
        console.log(
          `Weighbridge "${wb.name}" already exists (ID: ${existing[0].id})`
        );
      } else {
        const result = await dataSource.query(
          `INSERT INTO weighbridge_masters (tenant_id, name, code, location, description, is_active, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [tenantId, wb.name, wb.code, wb.location, wb.description, wb.isActive]
        );
        weighbridgeIds[wb.code] = result.insertId;
        console.log(
          `Created weighbridge "${wb.name}" (ID: ${result.insertId})`
        );
      }
    }

    // 6. Seed Camera Masters
    console.log("\n--- Seeding Camera Masters ---");
    const cameraIds: Record<string, number> = {};

    for (const cam of sampleCameras) {
      const existing = await dataSource.query(
        "SELECT id FROM camera_masters WHERE tenant_id = ? AND code = ?",
        [tenantId, cam.code]
      );

      if (existing.length > 0) {
        cameraIds[cam.code] = existing[0].id;
        console.log(
          `Camera "${cam.name}" already exists (ID: ${existing[0].id})`
        );
      } else {
        const result = await dataSource.query(
          `INSERT INTO camera_masters (tenant_id, name, code, location, description, camera_type, is_active, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            tenantId,
            cam.name,
            cam.code,
            cam.location,
            cam.description,
            cam.cameraType,
            cam.isActive,
          ]
        );
        cameraIds[cam.code] = result.insertId;
        console.log(`Created camera "${cam.name}" (ID: ${result.insertId})`);
      }
    }

    // 7. Seed Weighbridge Configurations
    console.log("\n--- Seeding Weighbridge Configurations ---");
    for (const config of sampleWeighbridgeConfigs) {
      const weighbridgeId = weighbridgeIds[config.weighbridgeCode];
      if (!weighbridgeId) continue;

      const existing = await dataSource.query(
        "SELECT id FROM weighbridge_configs WHERE weighbridge_master_id = ?",
        [weighbridgeId]
      );

      if (existing.length > 0) {
        console.log(`Config for ${config.weighbridgeCode} already exists`);
      } else {
        await dataSource.query(
          `INSERT INTO weighbridge_configs 
           (tenant_id, weighbridge_master_id, serial_port, baud_rate, data_bits, stop_bits, parity, 
            weight_regex, weight_start_marker, weight_end_marker, weight_multiplier, weight_unit, 
            polling_interval, stable_readings, stability_threshold, is_active, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            tenantId,
            weighbridgeId,
            config.serialPort,
            config.baudRate,
            config.dataBits,
            config.stopBits,
            config.parity,
            config.weightRegex,
            config.weightStartMarker,
            config.weightEndMarker,
            config.weightMultiplier,
            config.weightUnit,
            config.pollingInterval,
            config.stableReadings,
            config.stabilityThreshold,
            config.isActive,
          ]
        );
        console.log(`Created config for ${config.weighbridgeCode}`);
      }
    }

    // 8. Seed Camera Configurations
    console.log("\n--- Seeding Camera Configurations ---");
    for (const config of sampleCameraConfigs) {
      const cameraId = cameraIds[config.cameraCode];
      if (!cameraId) continue;

      const existing = await dataSource.query(
        "SELECT id FROM camera_configs WHERE camera_master_id = ?",
        [cameraId]
      );

      if (existing.length > 0) {
        console.log(`Config for ${config.cameraCode} already exists`);
      } else {
        await dataSource.query(
          `INSERT INTO camera_configs 
           (tenant_id, camera_master_id, rtsp_url, stream_url, username, password, 
            snapshot_width, snapshot_height, snapshot_quality, transport, timeout, is_active, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            tenantId,
            cameraId,
            config.rtspUrl,
            config.streamUrl,
            config.username,
            config.password,
            config.snapshotWidth,
            config.snapshotHeight,
            config.snapshotQuality,
            config.transport,
            config.timeout,
            config.isActive,
          ]
        );
        console.log(`Created config for ${config.cameraCode}`);
      }
    }

    console.log("\n=== Device Data Seeding Complete ===");
    console.log("\nSummary:");
    console.log(`- Device Modules: ${deviceModules.length}`);
    console.log(`- Weighbridge Masters: ${sampleWeighbridges.length}`);
    console.log(`- Camera Masters: ${sampleCameras.length}`);
    console.log(`- Weighbridge Configs: ${sampleWeighbridgeConfigs.length}`);
    console.log(`- Camera Configs: ${sampleCameraConfigs.length}`);

    await dataSource.destroy();
  } catch (error) {
    console.error("Error seeding device data:", error);
    process.exit(1);
  }
}

seedDeviceData();
