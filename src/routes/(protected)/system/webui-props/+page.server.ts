import { createLogger } from "$lib/utils/logger";
import { obp_requests } from "$lib/obp/requests";
import { error } from "@sveltejs/kit";
import type { OBPWebUIPropsResponse } from "$lib/obp/types";
import type { RequestEvent } from "@sveltejs/kit";

const logger = createLogger("WebUIPropsServer");

export async function load(event: RequestEvent) {
  logger.info("=== WebUI Props Page Load Started ===");

  const token = event.locals.session.data.oauth?.access_token;
  if (!token) {
    logger.error("No access token found in session");
    error(401, {
      message: "Unauthorized: No access token found in session.",
    });
  }

  logger.info("Access token present, attempting to fetch webui props");

  // Get the 'what' parameter from URL query string (default to 'active')
  const whatParam = event.url.searchParams.get("what") || "active";
  logger.info(`Fetching webui props with what=${whatParam}`);

  let webuiPropsResponse: OBPWebUIPropsResponse | undefined = undefined;

  try {
    // Fetch webui props using v6.0.0 endpoint
    // Optional what parameter: active (default), database, config
    const endpoint = `/obp/v6.0.0/webui-props?what=${whatParam}`;
    logger.info("=== WEBUI PROPS API CALL ===");
    logger.info(
      `Full API URL: ${process.env.PUBLIC_OBP_BASE_URL || ""}${endpoint}`,
    );
    logger.info(`Making API request to: ${endpoint}`);

    webuiPropsResponse = await obp_requests.get(endpoint, token);

    logger.info("=== WEBUI PROPS API RESPONSE ===");
    logger.info("API request completed successfully");
    logger.info(
      "Fetched webui props count:",
      webuiPropsResponse?.webui_props?.length || 0,
    );
  } catch (e: any) {
    logger.error("Error fetching webui props:", e);
    logger.error("Error details:", {
      message: e?.message,
      status: e?.status,
      statusText: e?.statusText,
      response: e?.response,
    });
    error(500, {
      message:
        "Could not fetch webui props at this time. Please try again later.",
    });
  }

  if (!webuiPropsResponse) {
    logger.error("No response from webui props endpoint");
    error(500, {
      message:
        "Could not fetch webui props at this time. Please try again later.",
    });
  }

  // Handle empty array case
  const webuiProps = webuiPropsResponse.webui_props || [];

  logger.info(`Total webui props received: ${webuiProps.length}`);

  if (webuiProps.length === 0) {
    logger.warn("No webui props returned from API. This could mean:");
    logger.warn("  1. No props exist in the OBP instance");
    logger.warn("  2. User lacks permissions to view props");
    logger.warn("  3. API endpoint requires different parameters");
  }

  // Sort webui props by name
  if (webuiProps.length > 0) {
    logger.info("Sorting webui props by name");
    webuiProps.sort((a, b) => a.name.localeCompare(b.name));
  }

  logger.info(
    `=== Returning ${webuiProps.length} webui props to the client ===`,
  );

  return {
    webuiProps,
    whatParam,
  };
}
