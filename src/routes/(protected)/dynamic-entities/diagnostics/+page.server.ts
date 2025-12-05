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
    const endpoint = "/obp/v5.1.0/management/system-dynamic-entities";
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

      let recordCount = 0;
      let fetchError: string | undefined;
      let responseKeys: string[] = [];
      let triedKeys: string[] = [];

      try {
        // Fetch data records for this entity
        const dataEndpoint = `/obp/dynamic-entity/${entityName}`;
        logger.info(`  Fetching data from: ${dataEndpoint}`);

        const dataResponse = await obp_requests.get(dataEndpoint, accessToken);
        responseKeys = Object.keys(dataResponse || {});
        logger.info(`  Response keys:`, responseKeys);
        logger.info(`  Full response:`, JSON.stringify(dataResponse, null, 2));

        // Try to find the records in various possible response structures
        let records: any[] = [];

        if (Array.isArray(dataResponse)) {
          records = dataResponse;
        } else {
          // Convert camelCase to snake_case properly
          // e.g., OGCR2ProjPerVerify -> ogcr2_proj_per_verify
          const toSnakeCase = (str: string) => {
            return str
              .replace(/([A-Z][a-z0-9]+)/g, "_$1")
              .replace(/([0-9]+)/g, "_$1")
              .replace(/^_/, "")
              .toLowerCase();
          };

          const snakeCaseKey = `${toSnakeCase(entityName)}_list`;
          const possibleKeys = [
            snakeCaseKey,
            `${entityName.toLowerCase()}_list`,
            "data",
            "records",
            entityName,
            `${entityName}_list`,
          ];

          triedKeys = possibleKeys;
          logger.info(`  Trying keys:`, possibleKeys);

          for (const key of possibleKeys) {
            if (dataResponse[key] && Array.isArray(dataResponse[key])) {
              records = dataResponse[key];
              logger.info(`  Found records under key: ${key}`);
              break;
            }
          }

          // If still no records, log the response structure
          if (records.length === 0) {
            logger.warn(
              `  Could not find records array. Response structure:`,
              JSON.stringify(dataResponse, null, 2),
            );
            fetchError = `Could not find records array. Response has keys: [${responseKeys.join(", ")}]. Tried keys: [${triedKeys.join(", ")}]`;
          }
        }

        recordCount = records.length;
        logger.info(`  Record count: ${recordCount}`);
      } catch (err: any) {
        logger.error(`  *** ERROR fetching data for ${entityName} ***`);
        logger.error(`  Error message:`, err?.message);
        logger.error(`  Error status:`, err?.status);
        logger.error(`  Error statusText:`, err?.statusText);
        logger.error(`  Error response:`, err?.response);
        logger.error(`  Full error:`, JSON.stringify(err, null, 2));
        fetchError = err?.message || "Failed to fetch data";
      }

      diagnostics.push({
        dynamicEntityId: entity.dynamicEntityId,
        entityName,
        recordCount,
        error: fetchError,
        schema,
        responseKeys,
        triedKeys,
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
