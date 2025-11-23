import {
  User,
  ShieldUser,
  KeyRound,
  IdCardLanyard,
  CreditCard,
  Server,
  Database,
  GitBranch,
} from "@lucide/svelte";
import { env } from "$env/dynamic/public";

export interface NavigationItem {
  href: string;
  label: string;
  iconComponent: any;
  external?: boolean;
}

// Build navigation items dynamically based on environment variables
function buildMyAccountItems(): NavigationItem[] {
  const items: NavigationItem[] = [
    { href: "/user", label: "Profile", iconComponent: User },
    { href: "/user/consents", label: "Consents", iconComponent: ShieldUser },
    {
      href: "/user/entitlements",
      label: "Entitlements",
      iconComponent: IdCardLanyard,
    }, // New item
  ];

  // Only add Subscriptions link if PUBLIC_SUBSCRIPTIONS_URL is set
  if (env.PUBLIC_SUBSCRIPTIONS_URL) {
    items.push({
      href: env.PUBLIC_SUBSCRIPTIONS_URL,
      label: "Subscriptions",
      iconComponent: CreditCard,
      external: true,
    });
  }

  return items;
}

export const myAccountItems = buildMyAccountItems();

export function getActiveMenuItem(pathname: string) {
  const found = myAccountItems.find((item) => {
    // Skip external links for active menu detection
    if (item.external) {
      return false;
    }
    if (item.href === "/user" && pathname === "/user") {
      return true;
    }
    return pathname.startsWith(item.href) && item.href !== "/user";
  });

  return found || myAccountItems[0]; // fallback to first item
}

// DevOps navigation items
function buildDevOpsItems(): NavigationItem[] {
  const items: NavigationItem[] = [
    { href: "/devops/logcache", label: "LogCache", iconComponent: Database },
    {
      href: "/devops/migrations",
      label: "Migrations",
      iconComponent: GitBranch,
    },
  ];

  return items;
}

export const devOpsItems = buildDevOpsItems();

export function getActiveDevOpsMenuItem(pathname: string) {
  const found = devOpsItems.find((item) => {
    // Skip external links for active menu detection
    if (item.external) {
      return false;
    }
    return pathname.startsWith(item.href);
  });

  return found || devOpsItems[0]; // fallback to first item
}
