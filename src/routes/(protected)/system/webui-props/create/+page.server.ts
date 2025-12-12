import type { PageServerLoad } from "./$types";
import { getCreateWebUIPropsRoles } from "$lib/utils/roleChecker";

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  // Get user entitlements from session for role checking
  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];

  // Get role requirements for creating webui props
  const requiredRoles = getCreateWebUIPropsRoles();

  return {
    userEntitlements,
    requiredRoles,
  };
};
