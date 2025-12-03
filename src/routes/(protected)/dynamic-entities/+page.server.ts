import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("DynamicEntitiesPageServer");

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for dynamic entities page");
    throw error(401, "No API access token available");
  }

  try {
    // Fetch dynamic entities from OBP API
    logger.info("Fetching dynamic entities...");
    const entitiesResponse = await obp_requests.get(
      "/obp/v6.0.0/management/dynamic-entities",
      accessToken,
    );
    const entities = entitiesResponse.dynamic_entities || [];
    logger.info(`Found ${entities.length} dynamic entities`);

    // Fetch dynamic entity definitions from OBP API
    logger.info("Fetching dynamic entity definitions...");
    const definitionsResponse = await obp_requests.get(
      "/obp/v6.0.0/management/dynamic-entity-definitions",
      accessToken,
    );
    const definitions = definitionsResponse.dynamic_entity_definitions || [];
    logger.info(`Found ${definitions.length} dynamic entity definitions`);

    return {
      entities,
      definitions,
    };
  } catch (err) {
    logger.error("Error fetching dynamic entities data:", err);
    // Return empty arrays instead of throwing error to allow page to render
    return {
      entities: [],
      definitions: [],
      error:
        err instanceof Error ? err.message : "Failed to fetch dynamic entities",
    };
  }
};
