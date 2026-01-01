import type { PageServerLoad } from "./$types";
import { getLogCacheRoles } from "$lib/utils/roleChecker";

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  // Get user entitlements from session for role checking
  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];

  // Get role requirements for log-cache page
  const requiredRoles = getLogCacheRoles();

  return {
    userEntitlements,
    requiredRoles,
  };
};
