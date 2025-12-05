import {
  User,
  ShieldUser,
  KeyRound,
  IdCardLanyard,
  CreditCard,
  Server,
  Database,
  GitBranch,
  Route,
  BarChart3,
  Shield,
  Users,
  FileCheck,
  Plus,
  Building2,
  Eye,
  Landmark,
  Box,
  Settings,
  FileText,
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
    { href: "/system/log-cache", label: "LogCache", iconComponent: Database },
    {
      href: "/system/migrations",
      label: "Migrations",
      iconComponent: GitBranch,
    },
    {
      href: "/system/webui-props",
      label: "WebUI Props",
      iconComponent: Settings,
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

// Integration navigation items
function buildIntegrationItems(): NavigationItem[] {
  const items: NavigationItem[] = [
    {
      href: "/integration/method-routings",
      label: "Method Routings",
      iconComponent: Route,
    },
  ];

  return items;
}

export const integrationItems = buildIntegrationItems();

export function getActiveIntegrationMenuItem(pathname: string) {
  const found = integrationItems.find((item) => {
    // Skip external links for active menu detection
    if (item.external) {
      return false;
    }
    return pathname.startsWith(item.href);
  });

  return found || integrationItems[0]; // fallback to first item
}

// API Metrics navigation items
function buildApiMetricsItems(): NavigationItem[] {
  const items: NavigationItem[] = [
    { href: "/metrics", label: "Metrics", iconComponent: BarChart3 },
    {
      href: "/aggregate-metrics",
      label: "Aggregate Metrics",
      iconComponent: BarChart3,
    },
  ];

  return items;
}

export const apiMetricsItems = buildApiMetricsItems();

export function getActiveApiMetricsMenuItem(pathname: string) {
  const found = apiMetricsItems.find((item) => {
    // Skip external links for active menu detection
    if (item.external) {
      return false;
    }
    return pathname.startsWith(item.href);
  });

  return found || apiMetricsItems[0]; // fallback to first item
}

// RBAC navigation items
function buildRbacItems(): NavigationItem[] {
  const items: NavigationItem[] = [
    { href: "/rbac/roles", label: "Roles", iconComponent: Shield },
    {
      href: "/rbac/entitlements",
      label: "Entitlements",
      iconComponent: KeyRound,
    },
    {
      href: "/rbac/entitlements/create",
      label: "Create Entitlement",
      iconComponent: Plus,
    },
    {
      href: "/rbac/groups",
      label: "Groups",
      iconComponent: Users,
    },
    {
      href: "/rbac/groups/create",
      label: "Create Group",
      iconComponent: Plus,
    },
    {
      href: "/rbac/memberships",
      label: "Memberships",
      iconComponent: Users,
    },
    {
      href: "/rbac/memberships/create",
      label: "Create Membership",
      iconComponent: Plus,
    },
    {
      href: "/rbac/entitlement-requests",
      label: "Entitlement Requests",
      iconComponent: FileCheck,
    },
    {
      href: "/rbac/banks",
      label: "Banks",
      iconComponent: Building2,
    },
  ];

  return items;
}

export const rbacItems = buildRbacItems();

export function getActiveRbacMenuItem(pathname: string) {
  const found = rbacItems.find((item) => {
    // Skip external links for active menu detection
    if (item.external) {
      return false;
    }
    return pathname.startsWith(item.href);
  });

  return found || rbacItems[0]; // fallback to first item
}

// Account Access navigation items
function buildAccountAccessItems(): NavigationItem[] {
  const items: NavigationItem[] = [
    {
      href: "/account-access/system-views",
      label: "System Views",
      iconComponent: Eye,
    },
    {
      href: "/account-access/custom-views",
      label: "Custom Views",
      iconComponent: Eye,
    },
    {
      href: "/account-access/accounts",
      label: "Accounts",
      iconComponent: Landmark,
    },
  ];

  return items;
}

export const accountAccessItems = buildAccountAccessItems();

export function getActiveAccountAccessMenuItem(pathname: string) {
  const found = accountAccessItems.find((item) => {
    // Skip external links for active menu detection
    if (item.external) {
      return false;
    }
    return pathname.startsWith(item.href);
  });

  return found || accountAccessItems[0]; // fallback to first item
}

// Dynamic Entities navigation items
function buildDynamicEntitiesItems(): NavigationItem[] {
  const items: NavigationItem[] = [
    {
      href: "/dynamic-entities/system",
      label: "System Dynamic Entities",
      iconComponent: Settings,
    },
    {
      href: "/dynamic-entities/diagnostics",
      label: "Diagnostics",
      iconComponent: FileCheck,
    },
  ];

  return items;
}

export const dynamicEntitiesItems = buildDynamicEntitiesItems();

export function getActiveDynamicEntitiesMenuItem(pathname: string) {
  const found = dynamicEntitiesItems.find((item) => {
    // Skip external links for active menu detection
    if (item.external) {
      return false;
    }
    return pathname.startsWith(item.href);
  });

  return found || dynamicEntitiesItems[0]; // fallback to first item
}
