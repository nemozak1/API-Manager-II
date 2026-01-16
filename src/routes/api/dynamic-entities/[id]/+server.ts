import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("DynamicEntityAPI");

export const GET: RequestHandler = async ({ params, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for dynamic entity retrieval");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const { id } = params;

    if (!id) {
      return json({ error: "Entity ID is required" }, { status: 400 });
    }

    logger.info(`Fetching dynamic entity: ${id}`);

    const endpoint = `/obp/v6.0.0/management/system-dynamic-entities/${id}`;
    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("Dynamic entity retrieved successfully");
    return json(response);
  } catch (err) {
    logger.error("Error fetching dynamic entity:", err);

    let errorMessage = "Failed to fetch dynamic entity";
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

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for dynamic entity update");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const { id } = params;

    if (!id) {
      return json({ error: "Entity ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { data } = body;

    if (!data || typeof data !== "object") {
      return json(
        { error: "data is required and must be an object" },
        { status: 400 },
      );
    }

    logger.info(`Updating dynamic entity: ${id}`);

    const endpoint = `/obp/v6.0.0/management/system-dynamic-entities/${id}`;
    const response = await obp_requests.put(endpoint, { data }, accessToken);

    logger.info("Dynamic entity updated successfully");
    return json(response);
  } catch (err) {
    logger.error("Error updating dynamic entity:", err);

    let errorMessage = "Failed to update dynamic entity";
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

export const DELETE: RequestHandler = async ({ params, locals, url }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for dynamic entity deletion");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const { id } = params;

    if (!id) {
      return json({ error: "Entity ID is required" }, { status: 400 });
    }

    // Check if cascade parameter is provided
    const cascade = url.searchParams.get("cascade") === "true";

    logger.info(`Deleting dynamic entity: ${id} (cascade: ${cascade})`);

    const endpoint = cascade
      ? `/obp/v6.0.0/management/system-dynamic-entities/cascade/${id}`
      : `/obp/v6.0.0/management/system-dynamic-entities/${id}`;
    logger.info(`Calling DELETE ${endpoint}`);
    const response = await obp_requests.delete(endpoint, accessToken);

    logger.info("Dynamic entity deleted successfully");
    return json(response);
  } catch (err) {
    logger.error("Error deleting dynamic entity:", err);

    // Log full error details
    if (err && typeof err === "object") {
      logger.error("Error details:", JSON.stringify(err, null, 2));
    }

    let errorMessage = "Failed to delete dynamic entity";
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
