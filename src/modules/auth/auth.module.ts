import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { User } from "../../entities/user.entity";
import { Subscription } from "../../entities/subscription.entity";
import { Role } from "../../entities/role.entity";
import { VerifyTokenMiddleware } from "../../common/middleware/verify-token.middleware";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Subscription, Role]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get("JWT_EXPIRATION") || "24h",
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerifyTokenMiddleware)
      .exclude(
        { path: "api/auth/login", method: RequestMethod.POST },
        { path: "auth/login", method: RequestMethod.POST },
        { path: "api/docs", method: RequestMethod.GET },
        { path: "api/docs/(.*)", method: RequestMethod.GET },
        { path: "api/seeder/seed", method: RequestMethod.POST },
        { path: "seeder/seed", method: RequestMethod.POST },
        { path: "api/seeder/migrate-permissions", method: RequestMethod.POST },
        { path: "seeder/migrate-permissions", method: RequestMethod.POST }
      )
      .forRoutes("*");
  }
}
