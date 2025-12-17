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

    logger.info("ABAC rules response received");
    logger.debug("Response type:", typeof response);
    logger.debug("Response keys:", response ? Object.keys(response) : "null");
    logger.debug("Full response:", JSON.stringify(response, null, 2));

    // The response should contain an array of rules
    if (response && typeof response === "object") {
      if (Array.isArray(response.abac_rules)) {
        abacRules = response.abac_rules;
        logger.info(
          `Retrieved ${abacRules.length} ABAC rules from response.abac_rules`,
        );
      } else if (Array.isArray(response.rules)) {
        abacRules = response.rules;
        logger.info(
          `Retrieved ${abacRules.length} ABAC rules from response.rules`,
        );
      } else if (Array.isArray(response)) {
        abacRules = response;
        logger.info(
          `Retrieved ${abacRules.length} ABAC rules from array response`,
        );
      } else {
        logger.warn(
          "Response does not contain abac_rules, rules, or is not an array",
        );
        logger.warn("Response structure:", JSON.stringify(response, null, 2));
        abacRules = [];
        errorMessage =
          "API returned unexpected response format. Check server logs for details.";
      }
    } else {
      logger.error("Response is not an object:", response);
      abacRules = [];
      errorMessage = "API returned invalid response";
    }

    if (abacRules.length === 0 && !errorMessage) {
      logger.warn("Successfully fetched but got 0 ABAC rules");
    }
  } catch (e) {
    logger.error("Error fetching ABAC rules:", e);
    logger.error(
      "Error type:",
      e instanceof Error ? e.constructor.name : typeof e,
    );
    if (e instanceof Error) {
      logger.error("Error message:", e.message);
      logger.error("Error stack:", e.stack);
    }
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
