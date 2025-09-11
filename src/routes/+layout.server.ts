import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = locals.session;

  return {
    user: session?.data?.user || null,
    authInfo: session?.data?.authInfo || null,
  };
};
