import { createLogger } from "$lib/utils/logger";
import { obp_requests } from "$lib/obp/requests";
import { error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

const logger = createLogger("ConsumerRateLimitsServer");

interface RateLimit {
  rate_limiting_id: string;
  from_date: string;
  to_date: string;
  per_second_call_limit: string;
  per_minute_call_limit: string;
  per_hour_call_limit: string;
  per_day_call_limit: string;
  per_week_call_limit: string;
  per_month_call_limit: string;
  created_at: string;
  updated_at: string;
  api_name?: string;
  api_version?: string;
  bank_id?: string;
}

interface Consumer {
  consumer_id: string;
  key?: string;
  secret?: string;
  app_name: string;
  app_type: string;
  description: string;
  developer_email: string;
  redirect_url: string;
  company: string;
  created_by_user_id: string;
  created: string;
  enabled: boolean;
}

interface CurrentUsage {
  calls_made: number;
  per_second: number;
  per_minute: number;
  per_hour: number;
  per_day: number;
  per_week: number;
  per_month: number;
  reset_in_seconds: number;
}

interface RateLimitingInfo {
  enabled: boolean;
  is_active: boolean;
  service_available: boolean;
  technology: string;
}

export async function load(event: RequestEvent) {
  const session = event.locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const token = sessionOAuth?.accessToken;

  if (!token) {
    error(401, {
      message: "Unauthorized: No access token found in session.",
    });
  }

  const consumerId = event.params.consumer_id;
  if (!consumerId) {
    error(400, {
      message: "Consumer ID is required.",
    });
  }

  let consumer: Consumer | undefined = undefined;
  let rateLimits: RateLimit[] = [];
  let currentUsage: CurrentUsage | undefined = undefined;
  let activeLimit: RateLimit | undefined = undefined;
  let rateLimitingInfo: RateLimitingInfo | undefined = undefined;

  // Fetch rate limiting system info
  try {
    rateLimitingInfo = await obp_requests.get(
      `/obp/v6.0.0/rate-limiting`,
      token,
    );
    logger.debug(
      `Rate limiting enabled: ${rateLimitingInfo?.enabled}, active: ${rateLimitingInfo?.is_active}`,
    );
  } catch (e) {
    logger.warn("Could not fetch rate limiting info:", e);
  }

  try {
    // Fetch consumer details
    consumer = await obp_requests.get(
      `/obp/v6.0.0/management/consumers/${consumerId}`,
      token,
    );

    logger.debug(`Retrieved consumer: ${consumer?.app_name}`);
  } catch (e) {
    logger.error("Error fetching consumer:", e);
    error(404, {
      message: "Consumer not found.",
    });
  }

  if (!consumer) {
    error(404, {
      message: "Consumer not found.",
    });
  }

  try {
    // Fetch rate limits for this consumer
    const rateLimitsResponse = await obp_requests.get(
      `/obp/v6.0.0/management/consumers/${consumerId}/consumer/rate-limits`,
      token,
    );

    rateLimits = rateLimitsResponse?.limits || [];
    logger.debug(`Retrieved ${rateLimits.length} rate limits for consumer`);

    // Determine active limit (current date falls between from_date and to_date)
    const now = new Date();
    activeLimit = rateLimits.find((limit) => {
      const fromDate = new Date(limit.from_date);
      const toDate = new Date(limit.to_date);
      return now >= fromDate && now <= toDate;
    });

    if (activeLimit) {
      logger.debug(`Found active limit: ${activeLimit.rate_limiting_id}`);
    }

    // Fetch current usage if consumer is enabled
    if (consumer.enabled) {
      try {
        currentUsage = await obp_requests.get(
          `/obp/v6.0.0/management/consumers/${consumerId}/consumer/current-usage`,
          token,
        );
        logger.debug(`Retrieved current usage for consumer`);
      } catch (e) {
        logger.warn(`Could not fetch current usage for consumer:`, e);
      }
    }
  } catch (e) {
    logger.warn(`Could not fetch rate limits for consumer:`, e);
  }

  // Sort rate limits by from_date, most recent first
  rateLimits.sort((a, b) => {
    const dateA = new Date(a.from_date).getTime();
    const dateB = new Date(b.from_date).getTime();
    return dateB - dateA;
  });

  return {
    consumer,
    rateLimits,
    currentUsage,
    activeLimit,
    rateLimitingInfo,
  };
}
