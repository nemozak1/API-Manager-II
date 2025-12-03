import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("DynamicEntitiesCreatePageServer");

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for dynamic entities create page");
    throw error(401, "No API access token available");
  }

  try {
    // Fetch all dynamic entity definitions
    logger.info("Fetching dynamic entity definitions...");
    const response = await obp_requests.get(
      "/obp/v6.0.0/management/dynamic-entity-definitions",
      accessToken,
    );
    const definitions = response.dynamic_entity_definitions || [];
    logger.info(`Found ${definitions.length} entity definitions`);

    return {
      definitions,
    };
  } catch (err) {
    logger.error("Error fetching entity definitions:", err);
    return {
      definitions: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to fetch entity definitions",
    };
  }
};
