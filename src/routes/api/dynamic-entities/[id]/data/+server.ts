import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("DynamicEntityDataAPI");

// Helper function to get entity name from entity ID
async function getEntityName(
  entityId: string,
  accessToken: string,
): Promise<string | null> {
  try {
    const entitiesResponse = await obp_requests.get(
      "/obp/v4.0.0/management/system-dynamic-entities",
      accessToken,
    );
    const entities = entitiesResponse.dynamic_entities || [];
    const entity = entities.find((e: any) => e.dynamicEntityId === entityId);

    if (!entity) return null;

    // The entity name is the schema key (Piano, Guitar, etc.)
    const metadataFields = ["userId", "dynamicEntityId", "hasPersonalEntity"];
    const keys = Object.keys(entity).filter(
      (key) => !metadataFields.includes(key),
    );
    return keys[0] || null;
  } catch (err) {
    logger.error("Error fetching entity name:", err);
    return null;
  }
}

// GET - List all records for an entity
export const GET: RequestHandler = async ({ params, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const { id } = params;

    if (!id) {
      return json({ error: "Entity ID is required" }, { status: 400 });
    }

    // Get entity name from ID
    const entityName = await getEntityName(id, accessToken);
    if (!entityName) {
      return json({ error: "Entity not found" }, { status: 404 });
    }

    logger.info(`Fetching records for entity: ${entityName}`);

    const endpoint = `/obp/dynamic-entity/${entityName}`;
    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("Records retrieved successfully");
    return json(response);
  } catch (err) {
    logger.error("Error fetching records:", err);

    let errorMessage = "Failed to fetch records";
    let obpErrorCode = undefined;

    if (err instanceof Error) {
      errorMessage = err.message;
      if ("obpErrorCode" in err) {
        obpErrorCode = (err as any).obpErrorCode;
      }
    }

    const errorResponse: any = { error: errorMessage };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};

// POST - Create a new record
export const POST: RequestHandler = async ({ params, request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const { id } = params;

    if (!id) {
      return json({ error: "Entity ID is required" }, { status: 400 });
    }

    const body = await request.json();

    if (!body || typeof body !== "object") {
      return json(
        { error: "Request body must be a valid object" },
        { status: 400 },
      );
    }

    // Get entity name from ID
    const entityName = await getEntityName(id, accessToken);
    if (!entityName) {
      return json({ error: "Entity not found" }, { status: 404 });
    }

    logger.info(`Creating record for entity: ${entityName}`);
    logger.info(`Data: ${JSON.stringify(body)}`);

    const endpoint = `/obp/dynamic-entity/${entityName}`;
    const response = await obp_requests.post(endpoint, body, accessToken);

    logger.info("Record created successfully");
    return json(response);
  } catch (err) {
    logger.error("Error creating record:", err);

    let errorMessage = "Failed to create record";
    let obpErrorCode = undefined;

    if (err instanceof Error) {
      errorMessage = err.message;
      if ("obpErrorCode" in err) {
        obpErrorCode = (err as any).obpErrorCode;
      }
    }

    const errorResponse: any = { error: errorMessage };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
