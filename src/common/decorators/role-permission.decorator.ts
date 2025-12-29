import { SetMetadata } from "@nestjs/common";

export const PERMISSION_KEY = "permissions";

/**
 * Decorator to specify required permissions for a route.
 * User needs ANY ONE of the specified permissions to access the route (OR logic).
 * @param permissions - Array of permission codes (e.g., 'Vendor:Create', 'Vendor:Update')
 */
export const RolePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
