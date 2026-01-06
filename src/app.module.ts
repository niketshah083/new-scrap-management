import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { PlansModule } from "./modules/plans/plans.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { VendorsModule } from "./modules/vendors/vendors.module";
import { MaterialsModule } from "./modules/materials/materials.module";
import { PurchaseOrdersModule } from "./modules/purchase-orders/purchase-orders.module";
import { GRNFieldConfigModule } from "./modules/grn-field-config/grn-field-config.module";
import { GRNModule } from "./modules/grn/grn.module";
import { GatePassModule } from "./modules/gate-pass/gate-pass.module";
import { QCModule } from "./modules/qc/qc.module";
import { UsersModule } from "./modules/users/users.module";
import { RolesModule } from "./modules/roles/roles.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { ConfigModule as AppConfigModule } from "./modules/config/config.module";
import { SeederModule } from "./modules/seeder/seeder.module";
import { ExternalConnectionModule } from "./modules/external-connection/external-connection.module";
import { DataSourceModule } from "./modules/data-source/data-source.module";
import { RFIDModule } from "./modules/rfid/rfid.module";
import { WeighbridgeModule } from "./modules/weighbridge/weighbridge.module";
import { CameraModule } from "./modules/camera/camera.module";
import { DeviceBridgeModule } from "./modules/device-bridge/device-bridge.module";
import { LogInterceptor } from "./common/interceptors/log.interceptor";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { PermissionGuard } from "./common/guards/permission.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { ResponseInterceptor } from "./common";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get("DB_HOST"),
        port: +configService.get("DB_PORT"),
        username: configService.get("DB_USERNAME"),
        password: configService.get("DB_PASSWORD"),
        database: configService.get("DB_DATABASE"),
        entities: [__dirname + "/entities/**/*.entity{.ts,.js}"],
        synchronize: configService.get("NODE_ENV") === "development",
        logging: configService.get("NODE_ENV") === "development",
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ExternalConnectionModule,
    DataSourceModule,
    TenantsModule,
    PlansModule,
    SubscriptionsModule,
    VendorsModule,
    MaterialsModule,
    PurchaseOrdersModule,
    GRNFieldConfigModule,
    GRNModule,
    GatePassModule,
    QCModule,
    UsersModule,
    RolesModule,
    NotificationsModule,
    DashboardModule,
    UploadsModule,
    AppConfigModule,
    SeederModule,
    RFIDModule,
    WeighbridgeModule,
    CameraModule,
    DeviceBridgeModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {
    // Middleware will be configured in AuthModule
  }
}
