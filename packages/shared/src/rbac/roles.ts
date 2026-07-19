// Role definitions matching Prisma enum
export enum Role {
  DINER = "DINER",
  RESTAURANT_ADMIN = "RESTAURANT_ADMIN",
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
}

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.DINER]: 1,
  [Role.RESTAURANT_ADMIN]: 2,
  [Role.PLATFORM_ADMIN]: 3,
};

// Check if role has at least the required level
export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
