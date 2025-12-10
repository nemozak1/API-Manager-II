import { createLogger } from "$lib/utils/logger";
import { obp_requests } from "$lib/obp/requests";
import { error } from "@sveltejs/kit";
import type { OBPWebUIPropsResponse } from "$lib/obp/types";
import type { RequestEvent } from "@sveltejs/kit";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

const logger = createLogger("WebUIPropsServer");

export async function load(event: RequestEvent) {
  const session = event.locals.session;
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const token = sessionOAuth?.accessToken;

  if (!token) {
    error(401, {
      message: "Unauthorized: No access token found in session.",
    });
  }

  // Get filter from URL params, default to 'active'
  const filter = event.url.searchParams.get("what") || "active";

  // Validate filter
  if (!["active", "database", "config"].includes(filter)) {
    error(400, {
      message:
        "Invalid filter parameter. Must be 'active', 'database', or 'config'.",
    });
  }

  let propsResponse: OBPWebUIPropsResponse | undefined = undefined;

  try {
    propsResponse = await obp_requests.get(
      `/obp/v6.0.0/webui-props?what=${filter}`,
      token,
    );
    logger.debug(
      `Retrieved ${propsResponse?.webui_props?.length || 0} webui props with filter: ${filter}`,
    );
  } catch (e) {
    logger.error("Error fetching webui props:", e);
    error(500, {
      message:
        "Could not fetch webui props at this time. Please try again later.",
    });
  }

  if (!propsResponse || !propsResponse.webui_props) {
    error(500, {
      message:
        "Could not fetch webui props at this time. Please try again later.",
    });
  }

  const props = propsResponse.webui_props;

  // Sort props by name
  props.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  logger.debug(`Total props after processing: ${props.length}`);

  return {
    props,
    filter,
  };
}
