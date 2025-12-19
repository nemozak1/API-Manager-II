import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("MembershipsAPI");

interface User {
  user_id: string;
  username: string;
  email: string;
}

interface GroupMembership {
  group_id: string;
  user_id: string;
  bank_id: string;
  group_name: string;
}

interface Membership {
  user_id: string;
  username: string;
  group_id: string;
  group_name: string;
  bank_id: string;
}

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

    const endpoint = `/obp/v6.0.0/users/${user_id}/group-entitlements`;
    logger.info(`POST ${endpoint}`);
    logger.info(`Request body: ${JSON.stringify(requestBody)}`);

    const response = await obp_requests.post(
      endpoint,
      requestBody,
      accessToken,
    );

    logger.info("Group membership created successfully");
    logger.info(`Response: ${JSON.stringify(response)}`);

    // Log entitlements created and skipped
    if (
      response.entitlements_created &&
      response.entitlements_created.length > 0
    ) {
      logger.info(
        `Entitlements created: ${response.entitlements_created.join(", ")}`,
      );
    }

    if (
      response.entitlements_skipped &&
      response.entitlements_skipped.length > 0
    ) {
      logger.info(
        `Entitlements skipped: ${response.entitlements_skipped.join(", ")}`,
      );
    }

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

    // First, get all users
    const usersEndpoint = `/obp/v6.0.0/users`;
    logger.info(`Fetching users: ${usersEndpoint}`);
    const usersResponse = await obp_requests.get(usersEndpoint, accessToken);
    const users: User[] = usersResponse.users || [];

    logger.info(`Found ${users.length} users`);

    // For each user, fetch their group memberships
    const allMemberships: Membership[] = [];

    for (const user of users) {
      try {
        const membershipEndpoint = `/obp/v6.0.0/users/${user.user_id}/group-memberships`;
        const membershipResponse = await obp_requests.get(
          membershipEndpoint,
          accessToken,
        );

        if (
          membershipResponse.group_memberships &&
          Array.isArray(membershipResponse.group_memberships)
        ) {
          const userMemberships = membershipResponse.group_memberships.map(
            (gm: GroupMembership) => ({
              user_id: user.user_id,
              username: user.username,
              group_id: gm.group_id,
              group_name: gm.group_name,
              bank_id: gm.bank_id,
            }),
          );
          allMemberships.push(...userMemberships);
        }
      } catch (err) {
        // User might not have any group memberships, which is fine
        logger.debug(`No group memberships found for user ${user.user_id}`);
      }
    }

    logger.info(`Found ${allMemberships.length} total group memberships`);

    return json({ memberships: allMemberships });
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
