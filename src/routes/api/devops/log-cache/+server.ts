import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("LogCacheAPI");

export const GET: RequestHandler = async ({ url, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for log-cache API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const logLevel = url.searchParams.get("log_level");

    logger.info("=== LOG-CACHE API CALL ===");
    let endpoint = `/obp/v6.0.0/management/log-cache`;

    if (logLevel) {
      endpoint += `?log_level=${encodeURIComponent(logLevel)}`;
    }

    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("Raw response from OBP API:");
    logger.debug(JSON.stringify(response, null, 2));

    return json(response);
  } catch (err) {
    logger.error("ERROR FETCHING LOG-CACHE:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        error: err instanceof Error ? err.message : "Failed to fetch log-cache",
      },
      { status: 500 },
    );
  }
};
