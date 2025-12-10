import { createLogger } from "$lib/utils/logger";
const logger = createLogger("EntitlementRequestsPageServer");
import type { PageServerLoad } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { error } from "@sveltejs/kit";
import { getEntitlementRequestsPageRoles } from "$lib/utils/roleChecker";

interface EntitlementRequest {
  entitlement_request_id: string;
  user: {
    user_id: string;
    username: string;
    email: string;
  };
  role_name: string;
  bank_id?: string;
  created: string;
}

interface EntitlementRequestsResponse {
  entitlement_requests: EntitlementRequest[];
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for entitlement requests API calls");
    return {
      entitlementRequests: [],
      userEntitlements: [],
      requiredRoles: getEntitlementRequestsPageRoles(),
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  // Get user entitlements from session for role checking
  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];
  const requiredRoles = getEntitlementRequestsPageRoles();

  try {
    logger.info("=== ENTITLEMENT REQUESTS API CALL ===");
    const endpoint = `/obp/v6.0.0/entitlement-requests`;
    logger.info(`Request: ${endpoint}`);

    const response: EntitlementRequestsResponse = await obp_requests.get(
      endpoint,
      accessToken,
    );

    logger.info(
      `Response: ${response.entitlement_requests?.length || 0} entitlement requests`,
    );

    return {
      entitlementRequests: response.entitlement_requests || [],
      userEntitlements,
      requiredRoles,
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading entitlement requests:", err);

    return {
      entitlementRequests: [],
      userEntitlements,
      requiredRoles,
      hasApiAccess: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to load entitlement requests",
    };
  }
};
