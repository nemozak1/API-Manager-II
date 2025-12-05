import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("SystemDynamicEntitiesPageServer");

export const load: PageServerLoad = async ({ locals }) => {
  logger.info("=== System Dynamic Entities Page Load Started ===");

  const session = locals.session;

  if (!session?.data?.user) {
    logger.error("No user in session");
    throw error(401, "Unauthorized");
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.error("No access token available");
    throw error(401, "No API access token available");
  }

  logger.info("Access token present, fetching dynamic entities");

  try {
    const endpoint = "/obp/v5.1.0/management/system-dynamic-entities";
    logger.info(`Making API request to: ${endpoint}`);

    const entitiesResponse = await obp_requests.get(endpoint, accessToken);

    logger.info("API request completed successfully");
    logger.info("Response keys:", Object.keys(entitiesResponse || {}));
    logger.info("Full response:", JSON.stringify(entitiesResponse, null, 2));

    const entities = entitiesResponse.dynamic_entities || [];
    logger.info(`Found ${entities.length} dynamic entities`);

    if (entities.length > 0) {
      logger.info("First entity:", JSON.stringify(entities[0], null, 2));
    }

    return {
      entities,
    };
  } catch (err: any) {
    logger.error("Error fetching system dynamic entities:", err);
    logger.error("Error details:", {
      message: err?.message,
      status: err?.status,
      statusText: err?.statusText,
      response: err?.response,
    });
    return {
      entities: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to fetch system dynamic entities",
    };
  }
};
