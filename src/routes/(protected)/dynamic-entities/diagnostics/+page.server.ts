import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("DynamicEntityDiagnosticsPageServer");

interface EntityDiagnostic {
  dynamicEntityId: string;
  entityName: string;
  recordCount: number;
  error?: string;
  schema?: any;
  responseKeys?: string[];
  triedKeys?: string[];
  rawResponse?: any;
}

export const load: PageServerLoad = async ({ locals }) => {
  logger.info("=== Dynamic Entity Diagnostics Page Load Started ===");

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
    const endpoint = "/obp/v6.0.0/management/system-dynamic-entities";
    logger.info(`Making API request to: ${endpoint}`);

    const entitiesResponse = await obp_requests.get(endpoint, accessToken);
    const entities = entitiesResponse.dynamic_entities || [];
    logger.info(`Found ${entities.length} dynamic entities`);

    // For each entity, fetch the record count
    const diagnostics: EntityDiagnostic[] = [];

    for (const entity of entities) {
      // Extract entity name from the schema key
      const metadataFields = [
        "userId",
        "dynamicEntityId",
        "hasPersonalEntity",
        "entityName",
      ];
      const keys = Object.keys(entity).filter(
        (key) => !metadataFields.includes(key),
      );
      const entityName = keys[0] || "Unknown";
      const schema = entity[entityName];

      logger.info(
        `Checking entity: ${entityName} (ID: ${entity.dynamicEntityId})`,
      );

      // v6.0.0 API MUST provide record_count in the entity definition
      if (entity.record_count === undefined) {
        logger.error(`  *** ERROR: record_count missing for ${entityName} ***`);
        throw new Error(
          `API v6.0.0 must provide record_count for entity ${entityName}`,
        );
      }

      const recordCount = entity.record_count;
      logger.info(
        `  Using record_count from entity definition: ${recordCount}`,
      );

      // Still fetch raw response for debugging purposes
      let fetchError: string | undefined;
      let responseKeys: string[] = [];
      let triedKeys: string[] = [];
      let rawResponse: any = undefined;

      try {
        const dataEndpoint = `/obp/dynamic-entity/${entityName}`;
        logger.info(`  Fetching raw response from: ${dataEndpoint}`);

        const dataResponse = await obp_requests.get(dataEndpoint, accessToken);
        rawResponse = dataResponse;
        responseKeys = Object.keys(dataResponse || {});
        logger.info(`  Response keys:`, responseKeys);
      } catch (err: any) {
        logger.warn(
          `  Could not fetch raw response for ${entityName}:`,
          err?.message,
        );
        // Don't set fetchError - we already have the count from the entity definition
      }

      diagnostics.push({
        dynamicEntityId: entity.dynamicEntityId,
        entityName,
        recordCount,
        error: fetchError,
        schema,
        responseKeys,
        triedKeys,
        rawResponse,
      });
    }

    logger.info(
      `=== Diagnostics completed for ${diagnostics.length} entities ===`,
    );

    // Sort by entity name
    diagnostics.sort((a, b) => a.entityName.localeCompare(b.entityName));

    return {
      diagnostics,
      totalEntities: diagnostics.length,
      totalRecords: diagnostics.reduce((sum, d) => sum + d.recordCount, 0),
    };
  } catch (err: any) {
    logger.error("Error in diagnostics:", err);
    logger.error("Error details:", {
      message: err?.message,
      status: err?.status,
      statusText: err?.statusText,
    });

    throw error(
      500,
      err instanceof Error
        ? err.message
        : "Failed to fetch dynamic entity diagnostics",
    );
  }
};
