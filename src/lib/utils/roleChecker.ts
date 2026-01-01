import { createLogger } from "$lib/utils/logger";
const logger = createLogger("RoleChecker");

/**
 * Role requirement definition for a page or action
 */
export interface RoleRequirement {
  role: string;
  bankId?: string; // Optional bank_id if the role is bank-specific
  description?: string; // Human-readable description of why this role is needed
  action?: string; // What action this role enables (e.g., "view entitlements", "delete requests")
}

/**
 * Result of checking role requirements
 */
export interface RoleCheckResult {
  hasAllRoles: boolean;
  missingRoles: RoleRequirement[];
  hasRoles: RoleRequirement[];
}

/**
 * User entitlement from session
 */
export interface UserEntitlement {
  entitlement_id: string;
  role_name: string;
  bank_id: string;
}

/**
 * Check if a user has all required roles
 * @param userEntitlements - List of entitlements the user has
 * @param requiredRoles - List of roles required
 * @returns RoleCheckResult with missing and present roles
 */
export function checkRoles(
  userEntitlements: UserEntitlement[],
  requiredRoles: RoleRequirement[],
): RoleCheckResult {
  const missingRoles: RoleRequirement[] = [];
  const hasRoles: RoleRequirement[] = [];

  for (const requirement of requiredRoles) {
    const hasRole = userEntitlements.some((entitlement) => {
      // Check if role name matches
      const roleMatches = entitlement.role_name === requirement.role;

      if (!roleMatches) return false;

      // If requirement specifies a bank_id, check if it matches
      if (requirement.bankId) {
        return entitlement.bank_id === requirement.bankId;
      }

      // If no specific bank_id required, any instance of the role is fine
      return true;
    });

    if (hasRole) {
      hasRoles.push(requirement);
    } else {
      missingRoles.push(requirement);
    }
  }

  logger.debug(
    `Role check: ${hasRoles.length}/${requiredRoles.length} roles present`,
  );

  if (missingRoles.length > 0) {
    logger.warn("Missing roles:", missingRoles.map((r) => r.role).join(", "));
  }

  return {
    hasAllRoles: missingRoles.length === 0,
    missingRoles,
    hasRoles,
  };
}

/**
 * Group missing roles by bank_id for display purposes
 * @param missingRoles - List of missing role requirements
 * @returns Map of bankId -> role requirements
 */
export function groupMissingRolesByBank(
  missingRoles: RoleRequirement[],
): Map<string, RoleRequirement[]> {
  const grouped = new Map<string, RoleRequirement[]>();

  for (const requirement of missingRoles) {
    const key = requirement.bankId || "system-wide";
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(requirement);
  }

  return grouped;
}

/**
 * Common role requirements for different pages/actions
 */
export const ROLE_REQUIREMENTS = {
  // RBAC Management
  viewRoles: [
    {
      role: "CanGetRolesWithEntitlementCountsAtAllBanks",
      description: "View all roles and their entitlement counts",
      action: "view roles",
    },
  ],

  viewEntitlements: [
    {
      role: "CanGetEntitlementsForAnyUserAtAnyBank",
      description: "View all entitlements across all banks",
      action: "view entitlements",
    },
  ],

  createEntitlement: [
    {
      role: "CanCreateEntitlementAtAnyBank",
      description: "Create entitlements for users",
      action: "create entitlements",
    },
  ],

  deleteEntitlement: [
    {
      role: "CanDeleteEntitlementAtAnyBank",
      description: "Delete entitlements from users",
      action: "delete entitlements",
    },
  ],

  viewEntitlementRequests: [
    {
      role: "CanGetEntitlementRequestsAtAnyBank",
      description: "View entitlement requests",
      action: "view entitlement requests",
    },
  ],

  createEntitlementRequest: [
    {
      role: "CanCreateEntitlementRequestAtAnyBank",
      description: "Create entitlement requests",
      action: "create entitlement requests",
    },
  ],

  deleteEntitlementRequest: [
    {
      role: "CanDeleteEntitlementRequestsAtAnyBank",
      description: "Delete or accept entitlement requests",
      action: "delete entitlement requests",
    },
  ],

  // User Management
  viewUsers: [
    {
      role: "CanGetAnyUser",
      description: "View user information",
      action: "view users",
    },
  ],

  createUser: [
    {
      role: "CanCreateUser",
      description: "Create new users",
      action: "create users",
    },
  ],

  deleteUser: [
    {
      role: "CanDeleteUser",
      description: "Delete users",
      action: "delete users",
    },
  ],

  // WebUI Props Management
  viewWebUIProps: [
    {
      role: "CanGetWebUiProps",
      description: "View WebUI configuration properties",
      action: "view webui props",
    },
  ],

  createWebUIProps: [
    {
      role: "CanCreateWebUiProps",
      description: "Create WebUI configuration properties",
      action: "create webui props",
    },
  ],

  updateWebUIProps: [
    {
      role: "CanCreateWebUiProps",
      description: "Update WebUI configuration properties",
      action: "update webui props",
    },
  ],

  deleteWebUIProps: [
    {
      role: "CanDeleteWebUiProps",
      description: "Delete WebUI configuration properties",
      action: "delete webui props",
    },
  ],

  createSystemView: [
    {
      role: "CanCreateSystemView",
      description: "Create system views",
      action: "create system views",
    },
  ],

  updateSystemView: [
    {
      role: "CanUpdateSystemView",
      description: "Update system views",
      action: "update system views",
    },
  ],

  getViewPermissions: [
    {
      role: "CanGetViewPermissionsAtAllBanks",
      description: "Get view permissions at all banks",
      action: "get view permissions at all banks",
    },
  ],

  getAbacRules: [
    {
      role: "CanGetAbacRule",
      description: "Get ABAC rules",
      action: "get ABAC rules",
    },
  ],

  createAbacRule: [
    {
      role: "CanCreateAbacRule",
      description: "Create ABAC rules",
      action: "create ABAC rules",
    },
  ],

  updateAbacRule: [
    {
      role: "CanUpdateAbacRule",
      description: "Update ABAC rules",
      action: "update ABAC rules",
    },
  ],

  // System Management
  getLogCache: [
    {
      role: "CanGetLogCache",
      description: "View system log cache",
      action: "view log cache",
    },
  ],

  getMigrations: [
    {
      role: "CanGetMigrations",
      description: "View database migrations",
      action: "view migrations",
    },
  ],

  // Cache Management
  getCacheConfig: [
    {
      role: "CanGetCacheConfig",
      description: "View cache configuration",
      action: "view cache configuration",
    },
  ],

  getCacheInfo: [
    {
      role: "CanGetCacheInfo",
      description: "View cache information and statistics",
      action: "view cache information",
    },
  ],

  invalidateCache: [
    {
      role: "CanInvalidateCacheNamespace",
      description: "Invalidate cache namespaces",
      action: "invalidate cache",
    },
  ],

  // Rate Limiting
  createRateLimit: [
    {
      role: "CanCreateRateLimits",
      description: "Create rate limits for consumers",
      action: "create rate limits",
    },
  ],

  updateRateLimit: [
    {
      role: "CanUpdateRateLimits",
      description: "Update rate limits for consumers",
      action: "update rate limits",
    },
  ],

  deleteRateLimit: [
    {
      role: "CanDeleteRateLimits",
      description: "Delete rate limits for consumers",
      action: "delete rate limits",
    },
  ],

  viewRateLimit: [
    {
      role: "CanGetRateLimits",
      description: "View rate limits for consumers",
      action: "view rate limits",
    },
  ],
} as const;

/**
 * Get role requirements for the entitlement requests page
 * This page needs roles to view, accept (create+delete), and decline (delete) requests
 */
export function getEntitlementRequestsPageRoles(): RoleRequirement[] {
  return [
    ...ROLE_REQUIREMENTS.viewEntitlementRequests,
    ...ROLE_REQUIREMENTS.createEntitlement,
    ...ROLE_REQUIREMENTS.deleteEntitlementRequest,
  ];
}

/**
 * Get role requirements for the entitlements page
 */
export function getEntitlementsPageRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.viewEntitlements];
}

/**
 * Get role requirements for the roles page
 */
export function getRolesPageRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.viewRoles];
}

/**
 * Get role requirements for creating webui props
 */
export function getCreateWebUIPropsRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.createWebUIProps];
}

/**
 * Get role requirements for viewing webui props
 */
export function getViewWebUIPropsRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.viewWebUIProps];
}

/**
 * Get role requirements for updating webui props
 */
export function getUpdateWebUIPropsRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.updateWebUIProps];
}

/**
 * Get role requirements for deleting webui props
 */
export function getDeleteWebUIPropsRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.deleteWebUIProps];
}

/**
 * Get role requirements for creating system views
 */
export function getCreateSystemViewRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.createSystemView];
}

/**
 * Get role requirements for getting view permissions
 */
export function getGetViewPermissionsRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.getViewPermissions];
}

/**
 * Get role requirements for creating system views page (includes all needed roles)
 */
export function getCreateSystemViewPageRoles(): RoleRequirement[] {
  return [
    ...ROLE_REQUIREMENTS.createSystemView,
    ...ROLE_REQUIREMENTS.getViewPermissions,
  ];
}

/**
 * Get role requirements for viewing ABAC rules
 */
export function getAbacRulesRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.getAbacRules];
}

/**
 * Get role requirements for creating ABAC rules
 */
export function getCreateAbacRuleRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.createAbacRule];
}

/**
 * Get role requirements for updating ABAC rules
 */
export function getUpdateAbacRuleRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.updateAbacRule];
}

/**
 * Get role requirements for updating system views
 */
export function getUpdateSystemViewRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.updateSystemView];
}

/**
 * Get role requirements for updating system views page (includes all needed roles)
 */
export function getUpdateSystemViewPageRoles(): RoleRequirement[] {
  return [
    ...ROLE_REQUIREMENTS.updateSystemView,
    ...ROLE_REQUIREMENTS.getViewPermissions,
  ];
}

/**
 * Get role requirements for creating rate limits
 */
export function getCreateRateLimitRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.createRateLimit];
}

/**
 * Get role requirements for updating rate limits
 */
export function getUpdateRateLimitRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.updateRateLimit];
}

/**
 * Get role requirements for deleting rate limits
 */
export function getDeleteRateLimitRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.deleteRateLimit];
}

/**
 * Get role requirements for viewing rate limits
 */
export function getViewRateLimitRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.viewRateLimit];
}

/**
 * Get roles required to view cache configuration
 */
export function getViewCacheConfigRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.getCacheConfig];
}

/**
 * Get roles required to view cache information
 */
export function getViewCacheInfoRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.getCacheInfo];
}

/**
 * Get roles required to invalidate cache
 */
export function getInvalidateCacheRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.invalidateCache];
}

/**
 * Get combined roles required for cache page
 */
export function getCachePageRoles(): RoleRequirement[] {
  return [
    ...ROLE_REQUIREMENTS.getCacheConfig,
    ...ROLE_REQUIREMENTS.getCacheInfo,
    ...ROLE_REQUIREMENTS.invalidateCache,
  ];
}

/**
 * Get roles required to view log cache
 */
export function getLogCacheRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.getLogCache];
}

/**
 * Get roles required to view migrations
 */
export function getMigrationsRoles(): RoleRequirement[] {
  return [...ROLE_REQUIREMENTS.getMigrations];
}
