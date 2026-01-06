import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DeviceBridgeGateway } from "./device-bridge.gateway";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: { expiresIn: configService.get("JWT_EXPIRES_IN") },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [DeviceBridgeGateway],
  exports: [DeviceBridgeGateway],
})
export class DeviceBridgeModule {}
