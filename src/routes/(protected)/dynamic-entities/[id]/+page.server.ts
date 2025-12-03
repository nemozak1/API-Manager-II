import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("DynamicEntityViewPageServer");

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = locals.session;
  const entityId = params.id;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for dynamic entity view page");
    throw error(401, "No API access token available");
  }

  try {
    // Fetch the specific dynamic entity
    logger.info(`Fetching dynamic entity: ${entityId}`);
    const entityResponse = await obp_requests.get(
      `/obp/v6.0.0/management/dynamic-entities/${entityId}`,
      accessToken,
    );
    const entity = entityResponse;

    if (!entity) {
      throw error(404, "Entity not found");
    }

    // Get the definition ID from the entity
    const definitionId = entity.dynamic_entity_id || entity.definition_id;

    if (!definitionId) {
      logger.error("Entity missing definition ID");
      throw error(500, "Entity is missing definition information");
    }

    // Fetch the entity's definition
    logger.info(`Fetching entity definition: ${definitionId}`);
    const definitionResponse = await obp_requests.get(
      `/obp/v6.0.0/management/dynamic-entity-definitions/${definitionId}`,
      accessToken,
    );
    const definition = definitionResponse;

    if (!definition) {
      throw error(404, "Entity definition not found");
    }

    return {
      entity,
      definition,
    };
  } catch (err) {
    logger.error("Error fetching entity:", err);
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to load entity data");
  }
};
