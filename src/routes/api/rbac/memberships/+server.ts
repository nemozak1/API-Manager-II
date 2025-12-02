import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("MembershipsAPI");

// POST - Create a new group membership
export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for membership creation");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { user_id, group_id } = body;

    if (!user_id) {
      return json({ error: "user_id is required" }, { status: 400 });
    }

    if (!group_id) {
      return json({ error: "group_id is required" }, { status: 400 });
    }

    logger.info("=== CREATE GROUP MEMBERSHIP ===");
    logger.info(`User ID: ${user_id}`);
    logger.info(`Group ID: ${group_id}`);

    const requestBody = {
      group_id,
    };

    const endpoint = `/obp/v6.0.0/users/${user_id}/group-memberships`;
    logger.info(`POST ${endpoint}`);
    logger.info(`Request body: ${JSON.stringify(requestBody)}`);

    const response = await obp_requests.post(
      endpoint,
      requestBody,
      accessToken,
    );

    logger.info("Group membership created successfully");
    logger.info(`Response: ${JSON.stringify(response)}`);

    return json(response);
  } catch (err) {
    logger.error("Error creating group membership:", err);

    let errorMessage = "Failed to create group membership";
    let obpErrorCode = undefined;

    if (err instanceof Error) {
      errorMessage = err.message;
      // Check if it's an OBPRequestError with obpErrorCode property
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

// GET - Fetch all memberships (aggregated from all users with group memberships)
export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for memberships list");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info("=== FETCHING ALL GROUP MEMBERSHIPS ===");

    // We need to get all entitlements and filter those with group_id set
    const endpoint = `/obp/v6.0.0/entitlements`;
    logger.info(`GET ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    // Filter entitlements that have a group_id (these are group memberships)
    const entitlements = response.list || [];
    const memberships = entitlements.filter(
      (ent: any) => ent.group_id && ent.group_id.trim() !== "",
    );

    logger.info(`Found ${memberships.length} group memberships`);

    return json({ memberships });
  } catch (err) {
    logger.error("Error fetching group memberships:", err);

    let errorMessage = "Failed to fetch group memberships";
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
