import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("DeleteGroupAPI");

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { group_id } = params;

  if (!group_id) {
    return json({ error: "group_id is required" }, { status: 400 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for group deletion");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info("=== DELETE GROUP ===");
    logger.info(`Group ID: ${group_id}`);

    const endpoint = `/obp/v6.0.0/management/groups/${group_id}`;
    logger.info(`DELETE ${endpoint}`);

    const response = await obp_requests.delete(endpoint, accessToken);

    logger.info("Group deleted successfully");
    logger.info(`Response: ${JSON.stringify(response)}`);

    return json(response);
  } catch (err) {
    logger.error("Error deleting group:", err);

    let errorMessage = "Failed to delete group";
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
