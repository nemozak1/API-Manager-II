import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { getAbacRulesRoles } from "$lib/utils/roleChecker";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("AbacPoliciesServer");

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const token = sessionOAuth?.accessToken;

  if (!token) {
    error(401, {
      message: "Unauthorized: No access token found in session.",
    });
  }

  // Get user entitlements from session for role checking
  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];

  // Get role requirements for viewing ABAC rules
  const requiredRoles = getAbacRulesRoles();

  // Fetch ABAC rules from OBP API
  let abacRules: any[] = [];
  let hasApiAccess = true;
  let errorMessage = null;

  try {
    logger.info("Fetching ABAC rules from API");
    const endpoint = "/obp/v6.0.0/management/abac-rules";
    const response = await obp_requests.get(endpoint, token);

    logger.debug("ABAC rules response:", JSON.stringify(response, null, 2));

    // The response should contain an array of rules
    abacRules = response.abac_rules || response.rules || response || [];

    logger.info(`Retrieved ${abacRules.length} ABAC rules`);
  } catch (e) {
    logger.error("Error fetching ABAC rules:", e);
    hasApiAccess = false;
    errorMessage =
      e instanceof Error ? e.message : "Failed to fetch ABAC rules";
  }

  return {
    abacRules,
    userEntitlements,
    requiredRoles,
    hasApiAccess,
    error: errorMessage,
  };
};
