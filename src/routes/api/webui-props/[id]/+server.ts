import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("WebUIPropAPI");

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for webui prop update");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const { id } = params;

    if (!id) {
      return json({ error: "Prop name is required" }, { status: 400 });
    }

    const body = await request.json();
    const { value } = body;

    if (!value || typeof value !== "string") {
      return json(
        { error: "value is required and must be a string" },
        { status: 400 },
      );
    }

    logger.info(`Updating webui prop: ${id}`);

    const requestBody = {
      value,
    };

    const endpoint = `/obp/v6.0.0/management/webui_props/${id}`;
    const response = await obp_requests.put(endpoint, requestBody, accessToken);

    logger.info("WebUI prop updated successfully");
    return json(response);
  } catch (err) {
    logger.error("Error updating webui prop:", err);

    let errorMessage = "Failed to update webui prop";
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

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for webui prop deletion");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const { id } = params;

    if (!id) {
      return json({ error: "Prop name is required" }, { status: 400 });
    }

    logger.info(`Deleting webui prop: ${id}`);

    const endpoint = `/obp/v6.0.0/management/webui_props/${id}`;
    logger.info(`Calling DELETE ${endpoint}`);
    const response = await obp_requests.delete(endpoint, accessToken);

    logger.info("WebUI prop deleted successfully");
    return json(response);
  } catch (err) {
    logger.error("Error deleting webui prop:", err);

    // Log full error details
    if (err && typeof err === "object") {
      logger.error("Error details:", JSON.stringify(err, null, 2));
    }

    let errorMessage = "Failed to delete webui prop";
    let obpErrorCode = undefined;
    let detailedError = undefined;

    if (err instanceof Error) {
      errorMessage = err.message;
      if ("obpErrorCode" in err) {
        obpErrorCode = (err as any).obpErrorCode;
      }
      if ("response" in err) {
        detailedError = (err as any).response;
      }
    }

    const errorResponse: any = {
      error: errorMessage,
      details: detailedError,
    };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
