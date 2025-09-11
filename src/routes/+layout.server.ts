import type { LayoutServerLoad } from "./$types";
import type { User, AuthInfo, LayoutData } from "$lib/types";

export const load: LayoutServerLoad = async ({
  locals,
}): Promise<LayoutData> => {
  const session = locals.session;

  return {
    user: (session?.data?.user as User) || null,
    authInfo: (session?.data?.authInfo as AuthInfo) || null,
  };
};
