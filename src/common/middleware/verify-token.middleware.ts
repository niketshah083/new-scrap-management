import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "../../modules/auth/auth.service";

export interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Injectable()
export class VerifyTokenMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid authorization header",
      );
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      req.user = {
        userId: payload.userId,
        tenantId: payload.tenantId,
        roleId: payload.roleId,
        isSuperAdmin: payload.isSuperAdmin,
      };
      next();
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
