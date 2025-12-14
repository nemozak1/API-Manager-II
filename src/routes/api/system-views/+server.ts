import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("SystemViewsAPI");

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for system view creation");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, is_public } = body;

    if (!name || typeof name !== "string") {
      return json(
        { error: "name is required and must be a string" },
        { status: 400 },
      );
    }

    if (!description || typeof description !== "string") {
      return json(
        { error: "description is required and must be a string" },
        { status: 400 },
      );
    }

    logger.info("Creating system view");
    logger.info(`Name: ${name}`);

    const requestBody = {
      name,
      description,
      is_public: is_public || false,
    };

    const endpoint = `/obp/v6.0.0/system-views`;
    logger.info(`POST ${endpoint}`);

    const response = await obp_requests.post(
      endpoint,
      requestBody,
      accessToken,
    );

    logger.info("System view created successfully");
    return json(response);
  } catch (err) {
    logger.error("Error creating system view:", err);

    let errorMessage = "Failed to create system view";
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
