import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { Logger } from "@nestjs/common";
import {
  AuthenticatedSocket,
  validateSocketToken,
} from "./guards/ws-auth.guard";
import { JwtPayload } from "../auth/auth.service";

interface WeightReading {
  weighbridgeMasterId: number;
  weight: number;
  unit: string;
  isStable: boolean;
  rawData: string;
  timestamp: Date;
}

interface CameraSnapshot {
  cameraMasterId: number;
  imageBase64: string;
  width: number;
  height: number;
  timestamp: Date;
}

interface CameraLiveFrame {
  cameraMasterId: number;
  frameBase64: string;
  timestamp: Date;
}

interface DeviceSelection {
  weighbridgeIds: number[];
  cameraIds: number[];
}

interface ConnectedDevice {
  socketId: string;
  tenantId: number;
  userId: number;
  deviceType: "electron" | "frontend";
  selectedWeighbridges: number[];
  selectedCameras: number[];
  connectedAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: "*",
    credentials: true,
  },
  namespace: "/device-bridge",
})
export class DeviceBridgeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DeviceBridgeGateway.name);
  private connectedDevices: Map<string, ConnectedDevice> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client attempting to connect: ${client.id}`);

    const payload = await validateSocketToken(client, this.jwtService);

    if (!payload) {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.emit("error", { message: "Authentication required" });
      client.disconnect();
      return;
    }

    // Store authenticated socket
    (client as AuthenticatedSocket).user = payload;

    // Join tenant-specific room
    const tenantRoom = `tenant:${payload.tenantId}`;
    client.join(tenantRoom);

    this.logger.log(
      `Client connected: ${client.id}, Tenant: ${payload.tenantId}, User: ${payload.userId}`
    );

    // Notify other clients in the tenant room
    client.to(tenantRoom).emit("device:connected", {
      socketId: client.id,
      userId: payload.userId,
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket) {
    const device = this.connectedDevices.get(client.id);

    if (device) {
      const tenantRoom = `tenant:${device.tenantId}`;

      // Notify other clients in the tenant room
      client.to(tenantRoom).emit("device:disconnected", {
        socketId: client.id,
        userId: device.userId,
        timestamp: new Date(),
      });

      this.connectedDevices.delete(client.id);
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("device:authenticate")
  handleAuthenticate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { deviceType: "electron" | "frontend" }
  ) {
    const user = client.user;

    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    const device: ConnectedDevice = {
      socketId: client.id,
      tenantId: user.tenantId,
      userId: user.userId,
      deviceType: data.deviceType || "frontend",
      selectedWeighbridges: [],
      selectedCameras: [],
      connectedAt: new Date(),
    };

    this.connectedDevices.set(client.id, device);

    this.logger.log(
      `Device authenticated: ${client.id}, Type: ${device.deviceType}`
    );

    return {
      success: true,
      message: "Device authenticated successfully",
      data: {
        socketId: client.id,
        tenantId: user.tenantId,
        userId: user.userId,
      },
    };
  }

  @SubscribeMessage("device:select-weighbridges")
  handleSelectWeighbridges(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { weighbridgeIds: number[] }
  ) {
    const device = this.connectedDevices.get(client.id);

    if (!device) {
      return { success: false, message: "Device not registered" };
    }

    device.selectedWeighbridges = data.weighbridgeIds || [];

    // Join weighbridge-specific rooms
    data.weighbridgeIds?.forEach((id) => {
      client.join(`weighbridge:${id}`);
    });

    this.logger.log(
      `Weighbridges selected for ${client.id}: ${data.weighbridgeIds?.join(", ")}`
    );

    return {
      success: true,
      message: "Weighbridges selected successfully",
      data: { selectedWeighbridges: device.selectedWeighbridges },
    };
  }

  @SubscribeMessage("device:select-cameras")
  handleSelectCameras(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { cameraIds: number[] }
  ) {
    const device = this.connectedDevices.get(client.id);

    if (!device) {
      return { success: false, message: "Device not registered" };
    }

    device.selectedCameras = data.cameraIds || [];

    // Join camera-specific rooms
    data.cameraIds?.forEach((id) => {
      client.join(`camera:${id}`);
    });

    this.logger.log(
      `Cameras selected for ${client.id}: ${data.cameraIds?.join(", ")}`
    );

    return {
      success: true,
      message: "Cameras selected successfully",
      data: { selectedCameras: device.selectedCameras },
    };
  }

  @SubscribeMessage("weight:reading")
  handleWeightReading(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: WeightReading
  ) {
    const user = client.user;

    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    const tenantRoom = `tenant:${user.tenantId}`;

    // Broadcast to all frontend clients in the tenant room
    this.server.to(tenantRoom).emit("weight:update", {
      ...data,
      tenantId: user.tenantId,
      timestamp: data.timestamp || new Date(),
    });

    this.logger.debug(
      `Weight reading from ${client.id}: ${data.weight} ${data.unit}`
    );

    return { success: true, message: "Weight reading received" };
  }

  @SubscribeMessage("camera:snapshot")
  handleCameraSnapshot(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: CameraSnapshot
  ) {
    const user = client.user;

    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    const tenantRoom = `tenant:${user.tenantId}`;

    // Broadcast to all frontend clients in the tenant room
    this.server.to(tenantRoom).emit("camera:snapshot-received", {
      ...data,
      tenantId: user.tenantId,
      timestamp: data.timestamp || new Date(),
    });

    this.logger.debug(
      `Camera snapshot from ${client.id}: Camera ${data.cameraMasterId}`
    );

    return { success: true, message: "Camera snapshot received" };
  }

  @SubscribeMessage("camera:live-frame")
  handleCameraLiveFrame(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: CameraLiveFrame
  ) {
    const user = client.user;

    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    // Broadcast to clients subscribed to this camera's live stream
    const cameraRoom = `camera:${data.cameraMasterId}:live`;

    this.server.to(cameraRoom).emit("camera:live-frame", {
      ...data,
      tenantId: user.tenantId,
      timestamp: data.timestamp || new Date(),
    });

    return { success: true };
  }

  @SubscribeMessage("camera:subscribe-live")
  handleSubscribeLive(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { cameraMasterId: number }
  ) {
    const user = client.user;

    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    const cameraRoom = `camera:${data.cameraMasterId}:live`;
    client.join(cameraRoom);

    this.logger.log(
      `Client ${client.id} subscribed to live stream for camera ${data.cameraMasterId}`
    );

    return {
      success: true,
      message: "Subscribed to live stream",
    };
  }

  @SubscribeMessage("camera:unsubscribe-live")
  handleUnsubscribeLive(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { cameraMasterId: number }
  ) {
    const cameraRoom = `camera:${data.cameraMasterId}:live`;
    client.leave(cameraRoom);

    this.logger.log(
      `Client ${client.id} unsubscribed from live stream for camera ${data.cameraMasterId}`
    );

    return {
      success: true,
      message: "Unsubscribed from live stream",
    };
  }

  // Methods for broadcasting config updates (called from services)

  broadcastWeighbridgeConfigUpdate(tenantId: number, configId: number) {
    const tenantRoom = `tenant:${tenantId}`;
    this.server.to(tenantRoom).emit("config:weighbridge-updated", {
      configId,
      timestamp: new Date(),
    });
  }

  broadcastCameraConfigUpdate(tenantId: number, configId: number) {
    const tenantRoom = `tenant:${tenantId}`;
    this.server.to(tenantRoom).emit("config:camera-updated", {
      configId,
      timestamp: new Date(),
    });
  }

  // Methods for sending commands to Electron apps

  sendCaptureSnapshotCommand(tenantId: number, cameraMasterId: number) {
    const tenantRoom = `tenant:${tenantId}`;
    this.server.to(tenantRoom).emit("command:capture-snapshot", {
      cameraMasterId,
      timestamp: new Date(),
    });
  }

  sendReadWeightCommand(tenantId: number, weighbridgeMasterId: number) {
    const tenantRoom = `tenant:${tenantId}`;
    this.server.to(tenantRoom).emit("command:read-weight", {
      weighbridgeMasterId,
      timestamp: new Date(),
    });
  }

  // Get connected devices for a tenant
  getConnectedDevices(tenantId: number): ConnectedDevice[] {
    return Array.from(this.connectedDevices.values()).filter(
      (device) => device.tenantId === tenantId
    );
  }

  // Get device status
  @SubscribeMessage("device:get-status")
  handleGetStatus(@ConnectedSocket() client: AuthenticatedSocket) {
    const user = client.user;

    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    const devices = this.getConnectedDevices(user.tenantId);

    return {
      success: true,
      data: {
        connectedDevices: devices.map((d) => ({
          socketId: d.socketId,
          deviceType: d.deviceType,
          selectedWeighbridges: d.selectedWeighbridges,
          selectedCameras: d.selectedCameras,
          connectedAt: d.connectedAt,
        })),
      },
    };
  }
}
