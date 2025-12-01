import { createLogger } from "$lib/utils/logger";
const logger = createLogger("RoleDetailPageServer");
import type { PageServerLoad } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { error } from "@sveltejs/kit";
import { resourceDocsCache } from "$lib/stores/resourceDocsCache";

interface Entitlement {
  entitlement_id: string;
  role_name: string;
  bank_id: string;
  user_id: string;
  username: string;
}

interface EntitlementsResponse {
  list: Entitlement[];
}

interface ResourceDoc {
  operation_id: string;
  request_verb: string;
  request_url: string;
  summary: string;
  description?: string;
  markdown_description?: string;
  description_html?: string;
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

    const allEntitlements = entitlementsResponse.list || [];
    logger.info(`Found ${allEntitlements.length} entitlements`);

    // TODO: Filter out entitlements with null/empty usernames
    // This should be fixed at the API level - the entitlements endpoint should always return valid usernames
    const entitlements = allEntitlements.filter(
      (entitlement) =>
        entitlement.username && entitlement.username.trim() !== "",
    );
    logger.info(
      `Filtered to ${entitlements.length} entitlements with valid usernames (removed ${allEntitlements.length - entitlements.length})`,
    );

    // 2. Fetch resource docs from cache to find endpoints that require this role
    logger.info(`Fetching resource docs (from cache if available) for role`);
    const allResourceDocs = await (resourceDocsCache as any).fetchResourceDocs(
      accessToken,
    );

    // Filter resource docs that mention this role in their required roles
    const endpointsForRole = allResourceDocs.filter((doc: any) => {
      const roles = doc.roles || [];
      return roles.some((r: any) => r.role === roleName);
    });

    logger.info(`Found ${endpointsForRole.length} endpoints for this role`);

    return {
      roleName,
      entitlements,
      endpoints: endpointsForRole,
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading role details:", err);

    return {
      roleName,
      entitlements: [],
      endpoints: [],
      hasApiAccess: false,
      error: err instanceof Error ? err.message : "Failed to load role details",
    };
  }
};
