import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { getCreateSystemViewRoles } from "$lib/utils/roleChecker";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("CreateSystemViewServer");

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const token = sessionOAuth?.accessToken;

  if (!token) {
    error(401, {
      message: "Unauthorized: No access token found in session.",
    });
  }

  // Get user entitlements from session for role checking
  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];

  // Get role requirements for creating system views
  const requiredRoles = getCreateSystemViewRoles();

  logger.debug("Create system view page loaded");

  return {
    userEntitlements,
    requiredRoles,
  };
};
