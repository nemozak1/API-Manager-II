import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("EntitlementDeleteAPI");

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const entitlement_id = params.entitlement_id;

  if (!entitlement_id) {
    return json({ error: "entitlement_id is required" }, { status: 400 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for entitlement deletion");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info("=== DELETE ENTITLEMENT ===");
    logger.info(`Entitlement ID: ${entitlement_id}`);

    // Use v6.0.0 DELETE endpoint: /obp/v6.0.0/entitlements/{ENTITLEMENT_ID}
    const endpoint = `/obp/v6.0.0/entitlements/${entitlement_id}`;
    logger.info(`DELETE ${endpoint}`);

    const response = await obp_requests.delete(endpoint, accessToken);

    logger.info("Entitlement deleted successfully");

    return json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error("Error deleting entitlement:", err);

    let errorMessage = "Failed to delete entitlement";
    let obpErrorCode = undefined;

    if (err instanceof Error) {
      errorMessage = err.message;
      // Check if it's an OBPRequestError with obpErrorCode property
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
