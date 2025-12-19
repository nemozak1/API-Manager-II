import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

const logger = createLogger("MembershipsPageServer");

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

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for memberships page");
    return {
      memberships: [],
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  try {
    logger.info("=== FETCHING GROUP MEMBERSHIPS ===");

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

    logger.info(
      `Response: ${allMemberships.length} total group memberships found`,
    );

    return {
      memberships: allMemberships,
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading memberships:", err);

    return {
      memberships: [],
      hasApiAccess: false,
      error: err instanceof Error ? err.message : "Failed to load memberships",
    };
  }
};
