import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("AbacRuleExecuteAPI");

export const POST: RequestHandler = async ({ request, locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for ABAC rule execution");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const ruleId = params.rule_id;

  if (!ruleId) {
    return json({ error: "Rule ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { parameters } = body;

    logger.info(`Executing ABAC rule: ${ruleId}`);
    logger.info(`Parameters:`, JSON.stringify(parameters, null, 2));

    // Call the OBP API to execute the rule
    const endpoint = `/obp/v6.0.0/management/abac-rules/${ruleId}/execute`;
    logger.info(`POST ${endpoint}`);

    const requestBody = {
      parameters: parameters || {},
    };

    logger.info(
      "Request body being sent to OBP:",
      JSON.stringify(requestBody, null, 2),
    );

    const response = await obp_requests.post(
      endpoint,
      requestBody,
      accessToken,
    );

    logger.info("ABAC rule executed successfully");
    logger.info("OBP API response:", JSON.stringify(response, null, 2));

    return json(response);
  } catch (err) {
    logger.error(`Error executing ABAC rule ${ruleId}:`, err);

    let errorMessage = "Failed to execute ABAC rule";
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
