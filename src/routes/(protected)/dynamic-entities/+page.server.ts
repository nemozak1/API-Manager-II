import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    throw error(401, "No API access token available");
  }

  try {
    const entitiesResponse = await obp_requests.get(
      "/obp/v6.0.0/management/dynamic-entities",
      accessToken,
    );
    const entities = entitiesResponse.dynamic_entities || [];

    const definitionsResponse = await obp_requests.get(
      "/obp/v6.0.0/management/dynamic-entity-definitions",
      accessToken,
    );
    const definitions = definitionsResponse.dynamic_entity_definitions || [];

    return {
      entities,
      definitions,
    };
  } catch (err) {
    return {
      entities: [],
      definitions: [],
      error:
        err instanceof Error ? err.message : "Failed to fetch dynamic entities",
    };
  }
};
