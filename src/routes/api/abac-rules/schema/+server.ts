import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("AbacRuleSchemaAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for ABAC rule schema");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info("Fetching ABAC rule schema from OBP");

    // Call the OBP API to get the schema
    const endpoint = `/obp/v6.0.0/management/abac-rules/schema`;
    logger.info(`Calling endpoint: ${endpoint}`);
    logger.info(`Using access token: ${accessToken ? "present" : "missing"}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("ABAC rule schema fetched successfully");
    logger.info("Response type:", typeof response);
    logger.info("Response keys:", Object.keys(response || {}));
    logger.debug("Full OBP API response:", JSON.stringify(response, null, 2));

    return json(response);
  } catch (err) {
    logger.error("Error fetching ABAC rule schema:", err);
    logger.error("Error type:", typeof err);
    logger.error("Error constructor:", err?.constructor?.name);

    if (err && typeof err === "object") {
      logger.error("Error keys:", Object.keys(err));
      logger.error(
        "Error properties:",
        JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
      );
    }

    let errorMessage = "Failed to fetch ABAC rule schema";
    let statusCode = 500;

    if (err instanceof Error) {
      errorMessage = err.message;
      logger.error("Error message:", errorMessage);
      logger.error("Error stack:", err.stack);

      // Check for OBP-specific error properties
      if ("statusCode" in err) {
        statusCode = (err as any).statusCode;
        logger.error("OBP status code:", statusCode);
      }
      if ("obpErrorCode" in err) {
        logger.error("OBP error code:", (err as any).obpErrorCode);
      }
    }

    return json(
      {
        error: errorMessage,
        statusCode: statusCode,
        obpError: err,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
      },
      { status: statusCode },
    );
  }
};
