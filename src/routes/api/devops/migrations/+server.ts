import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("MigrationsAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  logger.info("=== MIGRATIONS AUTH DEBUG ===");
  logger.info(`Session exists: ${!!session}`);
  logger.info(`Session data exists: ${!!session?.data}`);
  logger.info(`User exists: ${!!session?.data?.user}`);

  if (!session?.data?.user) {
    logger.error("No user in session - returning 401");
    return json(
      { error: "Unauthorized - No user in session" },
      { status: 401 },
    );
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  logger.info(`SessionOAuth exists: ${!!sessionOAuth}`);

  const accessToken = sessionOAuth?.accessToken;
  logger.info(`Access token exists: ${!!accessToken}`);
  logger.info(`Access token length: ${accessToken?.length || 0}`);

  if (!accessToken) {
    logger.error("No access token available for migrations API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info("=== MIGRATIONS API CALL ===");
    const endpoint = `/obp/v6.0.0/devops/migrations`;

    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("Raw response from OBP API:");
    logger.debug(JSON.stringify(response, null, 2));

    return json(response);
  } catch (err) {
    logger.error("ERROR FETCHING MIGRATIONS:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch migrations",
      },
      { status: 500 },
    );
  }
};
