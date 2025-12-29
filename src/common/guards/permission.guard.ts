import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSION_KEY } from "../decorators/role-permission.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { SUPER_ADMIN_KEY } from "../decorators/super-admin.decorator";
import { RequestWithUser } from "../middleware/verify-token.middleware";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Check if route is super admin only
    const isSuperAdminOnly = this.reflector.getAllAndOverride<boolean>(
      SUPER_ADMIN_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (isSuperAdminOnly) {
      if (!user || !user.isSuperAdmin) {
        throw new ForbiddenException("Super admin access required");
      }
      return true;
    }

    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // If no user in request, deny access
    if (!user) {
      throw new ForbiddenException("Access denied");
    }

    // Super admin has all permissions
    if (user.isSuperAdmin) {
      return true;
    }

    // Check if user has ANY ONE of the required permissions (OR logic)
    // Note: In a full implementation, this would query the database
    // to check user's role permissions. For now, we'll implement the
    // structure and the actual permission check will be added when
    // Role and Permission entities are created.
    const hasAnyPermission = await this.checkUserPermissions(
      user.userId,
      user.tenantId,
      user.roleId,
      requiredPermissions
    );

    if (!hasAnyPermission) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }

  /**
   * Check if user has any of the required permissions.
   * This method will be enhanced when Role/Permission entities are implemented.
   */
  private async checkUserPermissions(
    _userId: number,
    _tenantId: number | null,
    roleId: number | null,
    _requiredPermissions: string[]
  ): Promise<boolean> {
    // TODO: Implement actual permission check against database
    // when Role and Permission entities are created.
    // For now, return true if user has a role assigned.
    // This will be replaced with actual database query in task 3.1

    if (!roleId) {
      return false;
    }

    // Placeholder: In full implementation, query role_permissions table
    // to check if user's role has any of the required permissions
    return true;
  }
}
