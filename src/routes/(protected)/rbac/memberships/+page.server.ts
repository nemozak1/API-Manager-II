import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

const logger = createLogger("MembershipsPageServer");

interface Membership {
  entitlement_id: string;
  user_id: string;
  username: string;
  group_id: string;
  role_name: string;
  bank_id: string;
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
    logger.warn("No access token available for memberships page");
    return {
      memberships: [],
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  try {
    logger.info("=== FETCHING GROUP MEMBERSHIPS ===");
    const endpoint = `/obp/v6.0.0/entitlements`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    // Filter entitlements that have a group_id (these are group memberships)
    const entitlements = response.list || [];
    const memberships = entitlements.filter(
      (ent: any) => ent.group_id && ent.group_id.trim() !== "",
    );

    logger.info(`Response: ${memberships.length} group memberships found`);

    return {
      memberships: memberships as Membership[],
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading memberships:", err);

    return {
      memberships: [],
      hasApiAccess: false,
      error: err instanceof Error ? err.message : "Failed to load memberships",
    };
  }
};
