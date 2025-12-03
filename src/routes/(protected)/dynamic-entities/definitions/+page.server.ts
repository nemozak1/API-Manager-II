import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("DynamicEntityDefinitionsPageServer");

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    throw error(401, "No API access token available");
  }

  try {
    // Fetch all dynamic entity definitions
    const definitionsResponse = await obp_requests.get(
      "/obp/v6.0.0/management/dynamic-entity-definitions",
      accessToken,
    );

    const definitions = definitionsResponse.dynamic_entity_definitions || [];

    // Fetch all dynamic entities to count entities per definition
    const entitiesResponse = await obp_requests.get(
      "/obp/v6.0.0/management/dynamic-entities",
      accessToken,
    );

    const entities = entitiesResponse.dynamic_entities || [];

    // Count entities per definition
    const entityCounts: Record<string, number> = {};
    entities.forEach((entity: any) => {
      const defId = entity.dynamic_entity_id || entity.definition_id;
      entityCounts[defId] = (entityCounts[defId] || 0) + 1;
    });

    // Add entity count to each definition
    const definitionsWithCounts = definitions.map((def: any) => ({
      ...def,
      entity_count: entityCounts[def.dynamic_entity_id || def.id] || 0,
    }));

    return {
      definitions: definitionsWithCounts,
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
