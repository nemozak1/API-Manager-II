import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = locals.session;
  const entityId = params.id;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    throw error(401, "No API access token available");
  }

  try {
    const entityResponse = await obp_requests.get(
      `/obp/v6.0.0/management/dynamic-entities/${entityId}`,
      accessToken,
    );
    const entity = entityResponse;

    if (!entity) {
      throw error(404, "Entity not found");
    }

    const definitionId = entity.dynamic_entity_id || entity.definition_id;

    if (!definitionId) {
      throw error(500, "Entity is missing definition information");
    }

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
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to load entity data");
  }
};
