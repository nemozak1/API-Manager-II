import type { PageServerLoad } from "./$types";
import { getMigrationsRoles } from "$lib/utils/roleChecker";

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  // Get user entitlements from session for role checking
  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];

  // Get role requirements for migrations page
  const requiredRoles = getMigrationsRoles();

  return {
    userEntitlements,
    requiredRoles,
  };
};
