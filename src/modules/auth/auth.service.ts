import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../../entities/user.entity";
import { Subscription } from "../../entities/subscription.entity";
import { Role } from "../../entities/role.entity";
import { LoginDto, LoginResponseDto } from "./dto/login.dto";

export interface JwtPayload {
  userId: number;
  tenantId: number | null;
  roleId: number | null;
  isSuperAdmin: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["tenant"],
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("User account is deactivated");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check tenant status for non-super admin users
    if (!user.isSuperAdmin && user.tenant && !user.tenant.isActive) {
      throw new UnauthorizedException("Tenant account is deactivated");
    }

    // Check subscription expiry for non-super admin users
    if (!user.isSuperAdmin && user.tenantId) {
      const isSubscriptionValid = await this.checkSubscriptionValidity(
        user.tenantId
      );
      if (!isSubscriptionValid) {
        throw new UnauthorizedException(
          "Tenant subscription has expired. Please contact support."
        );
      }
    }

    // Get user permissions from role
    let permissions: string[] = [];
    if (user.roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: user.roleId },
        relations: ["permissions"],
      });
      if (role && role.permissions) {
        permissions = role.permissions.map((p) => p.code);
      }
    }

    const payload: JwtPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      roleId: user.roleId,
      isSuperAdmin: user.isSuperAdmin,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        roleId: user.roleId,
        isSuperAdmin: user.isSuperAdmin,
        permissions,
      },
    };
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return payload;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Check if a tenant's subscription is valid (active and not expired)
   */
  private async checkSubscriptionValidity(tenantId: number): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId },
    });

    if (!subscription) {
      // No subscription found - allow access (tenant might be in trial or free tier)
      return true;
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);

    return subscription.status === "active" && endDate > now;
  }
}
