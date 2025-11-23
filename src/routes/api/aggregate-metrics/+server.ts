import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("AggregateMetricsAPI");

export const GET: RequestHandler = async ({ url, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for metrics API calls");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    // Get all query parameters from the request
    const queryString = url.searchParams.toString();

    // Build the OBP API endpoint with the query string
    const endpoint = `/obp/v6.0.0/management/aggregate-metrics?${queryString}`;

    logger.info("=== AGGREGATE METRICS API CALL ===");
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("Raw response from OBP API:");
    logger.info(JSON.stringify(response, null, 2));

    // Aggregate metrics returns an array with a single object containing count, average_response_time, min, max
    if (
      Array.isArray(response) &&
      response.length > 0 &&
      response[0].count !== undefined
    ) {
      const metrics = response[0];
      logger.info(
        `Response: count=${metrics.count}, avg=${metrics.average_response_time}ms`,
      );
      return json({
        count: metrics.count,
        average_response_time: metrics.average_response_time,
        minimum_response_time: metrics.minimum_response_time,
        maximum_response_time: metrics.maximum_response_time,
      });
    } else {
      logger.warn("NO AGGREGATE METRICS DATA IN RESPONSE");
      return json({
        count: 0,
        average_response_time: 0,
        minimum_response_time: 0,
        maximum_response_time: 0,
        error: "No aggregate metrics data found in API response",
      });
    }
  } catch (err) {
    logger.error("ERROR FETCHING AGGREGATE METRICS:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        count: 0,
        average_response_time: 0,
        minimum_response_time: 0,
        maximum_response_time: 0,
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch aggregate metrics",
      },
      { status: 500 },
    );
  }
};
