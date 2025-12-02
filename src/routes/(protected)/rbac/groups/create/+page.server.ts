import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

const logger = createLogger("CreateGroupPageServer");

interface Role {
  role: string;
  requires_bank_id: boolean;
}

interface RolesResponse {
  roles: Role[];
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
    logger.warn("No access token available for create group page");
    return {
      roles: [],
      userEntitlements: [],
      requiredRoles: [
        {
          role: "CanCreateGroupAtAllBanks",
          description: "Create groups at all banks",
          action: "create groups",
        },
        {
          role: "CanCreateGroupAtOneBank",
          description: "Create groups at one bank",
          action: "create groups",
        },
      ],
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  // Get user entitlements from session for role checking
  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];

  // Define required roles for creating groups
  const requiredRoles = [
    {
      role: "CanCreateGroupAtAllBanks",
      description: "Create groups at all banks",
      action: "create groups",
    },
    {
      role: "CanCreateGroupAtOneBank",
      description: "Create groups at one bank",
      action: "create groups",
    },
  ];

  try {
    logger.info("=== FETCHING ROLES FOR CREATE GROUP PAGE ===");
    const endpoint = `/obp/v6.0.0/roles`;
    logger.info(`Request: ${endpoint}`);

    const response: RolesResponse = await obp_requests.get(
      endpoint,
      accessToken,
    );

    logger.info(`Response: ${response.roles?.length || 0} roles`);

    return {
      roles: response.roles || [],
      userEntitlements,
      requiredRoles,
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading roles:", err);

    return {
      roles: [],
      userEntitlements,
      requiredRoles,
      hasApiAccess: false,
      error: err instanceof Error ? err.message : "Failed to load roles",
    };
  }
};
