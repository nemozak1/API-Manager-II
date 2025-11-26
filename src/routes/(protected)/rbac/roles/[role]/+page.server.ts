import { createLogger } from "$lib/utils/logger";
const logger = createLogger("RoleDetailPageServer");
import type { PageServerLoad } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { error } from "@sveltejs/kit";

interface Entitlement {
  entitlement_id: string;
  role_name: string;
  bank_id: string;
  user_id: string;
}

interface EntitlementsResponse {
  list: Entitlement[];
}

interface User {
  user_id: string;
  email: string;
  provider_id: string;
  provider: string;
  username: string;
  display_name?: string;
}

interface ResourceDoc {
  operation_id: string;
  request_verb: string;
  request_url: string;
  summary: string;
  description?: string;
}

interface ResourceDocsResponse {
  resource_docs: ResourceDoc[];
}

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = locals.session;
  const roleName = params.role;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for role detail API calls");
    return {
      roleName,
      entitlements: [],
      users: [],
      endpoints: [],
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  try {
    logger.info("=== ROLE DETAIL API CALLS ===");
    logger.info(`Role: ${roleName}`);

    // 1. Fetch entitlements for this role
    const entitlementsEndpoint = `/obp/v6.0.0/entitlements?role=${encodeURIComponent(roleName)}`;
    logger.info(`Fetching entitlements: ${entitlementsEndpoint}`);

    const entitlementsResponse: EntitlementsResponse = await obp_requests.get(
      entitlementsEndpoint,
      accessToken,
    );

    const entitlements = entitlementsResponse.list || [];
    logger.info(`Found ${entitlements.length} entitlements`);

    // 2. Fetch user details for each unique user_id
    const uniqueUserIds = [...new Set(entitlements.map((e) => e.user_id))];
    logger.info(`Fetching details for ${uniqueUserIds.length} unique users`);

    const usersPromises = uniqueUserIds.map(async (userId) => {
      try {
        const userEndpoint = `/obp/v6.0.0/users/user_id/${userId}`;
        const user: User = await obp_requests.get(userEndpoint, accessToken);
        return user;
      } catch (err) {
        logger.error(`Failed to fetch user ${userId}:`, err);
        return null;
      }
    });

    const usersResults = await Promise.all(usersPromises);
    const users = usersResults.filter((u) => u !== null) as User[];
    logger.info(`Successfully fetched ${users.length} user details`);

    // 3. Fetch resource docs to find endpoints that require this role
    logger.info(`Fetching resource docs to find endpoints for role`);
    const resourceDocsEndpoint = `/obp/v6.0.0/resource-docs/v6.0.0/obp`;
    const resourceDocsResponse: ResourceDocsResponse = await obp_requests.get(
      resourceDocsEndpoint,
      accessToken,
    );

    const allResourceDocs = resourceDocsResponse.resource_docs || [];

    // Filter resource docs that mention this role in their required roles
    const endpointsForRole = allResourceDocs.filter((doc: any) => {
      const roles = doc.roles || [];
      return roles.some((r: any) => r.role === roleName);
    });

    logger.info(`Found ${endpointsForRole.length} endpoints for this role`);

    return {
      roleName,
      entitlements,
      users,
      endpoints: endpointsForRole,
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading role details:", err);

    return {
      roleName,
      entitlements: [],
      users: [],
      endpoints: [],
      hasApiAccess: false,
      error: err instanceof Error ? err.message : "Failed to load role details",
    };
  }
};
