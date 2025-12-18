<script lang="ts">
  import "../app.css";
  import { Navigation } from "@skeletonlabs/skeleton-svelte";
  import { page } from "$app/state";
  import {
    myAccountItems,
    systemItems,
    integrationItems,
    apiMetricsItems,
    rbacItems,
    accountAccessItems,
    dynamicEntitiesItems,
    abacItems,
  } from "$lib/config/navigation";
  import Toast from "$lib/components/Toast.svelte";
  import ApiActivityIndicator from "$lib/components/ApiActivityIndicator.svelte";
  import { createLogger } from "$lib/utils/logger";
  import { resourceDocsCache } from "$lib/stores/resourceDocsCache";
  import { onMount } from "svelte";

  const logger = createLogger("LayoutClient");
  const layoutStartTime = performance.now();
  logger.info("🎨 Layout client initialization started");

  // Lucide Icons
  import {
    Menu,
    X,
    Compass,
    KeyRound,
    Star,
    SquareTerminal,
    UserPlus,
    Landmark,
    MessageCircleQuestion,
    ShieldUser,
    User,
    Users,
    ChevronDown,
    ChevronRight,
    Settings,
    Shield,
    CreditCard,
    BarChart3,
    Globe,
    Server,
    Plug,
    Database,
    Box,
    Lock,
  } from "@lucide/svelte";

  import { env } from "$env/dynamic/public";
  import LightSwitch from "$lib/components/LightSwitch.svelte";
  import type { RootLayoutData } from "./+layout.server";

  logger.info("📦 All imports loaded");
  const importsLoadedTime = performance.now();
  logger.info(
    `⏱️  Imports loaded in ${(importsLoadedTime - layoutStartTime).toFixed(2)}ms`,
  );

  let { data, children } = $props();
  logger.info("📊 Props received from server");
  let isAuthenticated = $state(false);
  let isMobileMenuOpen = $state(false);
  let isMyAccountExpanded = $state(false);
  let isSystemExpanded = $state(false);
  let isIntegrationExpanded = $state(false);
  let isApiMetricsExpanded = $state(false);
  let isRbacExpanded = $state(false);
  let isAccountAccessExpanded = $state(false);
  let isDynamicEntitiesExpanded = $state(false);
  let isAbacExpanded = $state(false);
  let displayMode: "dark" | "light" = $state("dark");
  let systemDynamicEntities = $state<any[]>([]);

  async function clearCache() {
    try {
      // Clear all caches
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error("Error clearing cache:", error);
      alert("Cache cleared. Page will reload.");
      window.location.reload();
    }
  }

  logger.info("🔐 Checking authentication state");

  // Make authentication reactive to data changes
  $effect(() => {
    if (data.email) {
      isAuthenticated = true;
      logger.info(`✅ User authenticated: ${data.email}`);
    } else {
      isAuthenticated = false;
      logger.info("ℹ️  User not authenticated");
    }
  });

  // Pre-warm resource docs cache in browser for authenticated users
  onMount(() => {
    if (isAuthenticated) {
      logger.info("🔄 Pre-warming browser resource docs cache...");
      resourceDocsCache.preWarmCache(undefined as any);
    }
  });

  // Fetch system dynamic entities for shortcuts
  async function fetchSystemDynamicEntities() {
    if (!isAuthenticated) return;

    try {
      const response = await fetch("/api/dynamic-entities/system/list", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        systemDynamicEntities = data.entities || [];
        logger.info(
          `✅ Loaded ${systemDynamicEntities.length} system dynamic entities`,
        );
      }
    } catch (error) {
      logger.error("Failed to fetch system dynamic entities:", error);
    }
  }

  onMount(() => {
    fetchSystemDynamicEntities();
  });

  // Refresh dynamic entities when navigating within dynamic entities section
  $effect(() => {
    if (page.url.pathname.startsWith("/dynamic-entities/system")) {
      fetchSystemDynamicEntities();
    }
  });

  let isMyAccountActive = $derived(
    page.url.pathname === "/user" || page.url.pathname.startsWith("/user/"),
  );
  let isSystemActive = $derived(
    page.url.pathname === "/system" || page.url.pathname.startsWith("/system/"),
  );
  let isIntegrationActive = $derived(
    page.url.pathname === "/integration" ||
      page.url.pathname.startsWith("/integration/"),
  );
  let isApiMetricsActive = $derived(
    page.url.pathname === "/metrics" ||
      page.url.pathname.startsWith("/metrics/") ||
      page.url.pathname === "/aggregate-metrics" ||
      page.url.pathname.startsWith("/aggregate-metrics/"),
  );
  let isRbacActive = $derived(
    page.url.pathname === "/rbac" || page.url.pathname.startsWith("/rbac/"),
  );
  let isAccountAccessActive = $derived(
    page.url.pathname === "/account-access" ||
      page.url.pathname.startsWith("/account-access/"),
  );
  let isDynamicEntitiesActive = $derived(
    page.url.pathname === "/dynamic-entities" ||
      page.url.pathname.startsWith("/dynamic-entities/"),
  );
  let isAbacActive = $derived(
    page.url.pathname === "/abac" || page.url.pathname.startsWith("/abac/"),
  );

  logger.info("🧭 Navigation state initialized");
  const navStateTime = performance.now();
  logger.info(
    `⏱️  Navigation state in ${(navStateTime - importsLoadedTime).toFixed(2)}ms`,
  );

  // Watch for route changes to auto-expand sections
  $effect(() => {
    logger.info("🔄 Route effect triggered");
    if (isMyAccountActive) {
      isMyAccountExpanded = true;
    }
    if (isSystemActive) {
      isSystemExpanded = true;
    }
    if (isIntegrationActive) {
      isIntegrationExpanded = true;
    }
    if (isApiMetricsActive) {
      isApiMetricsExpanded = true;
    }
    if (isRbacActive) {
      isRbacExpanded = true;
    }
    if (isAccountAccessActive) {
      isAccountAccessExpanded = true;
    }
    if (isAbacActive) {
      isAbacExpanded = true;
    }
    logger.info(`📍 Current route: ${page.url.pathname}`);
  });

  // Log when layout is fully initialized
  $effect(() => {
    const layoutEndTime = performance.now();
    const totalTime = layoutEndTime - layoutStartTime;
    logger.info(
      `✅ Layout client fully initialized in ${totalTime.toFixed(2)}ms`,
    );
  });

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function toggleMyAccount() {
    isMyAccountExpanded = !isMyAccountExpanded;
  }

  function toggleSystem() {
    isSystemExpanded = !isSystemExpanded;
  }

  function toggleIntegration() {
    isIntegrationExpanded = !isIntegrationExpanded;
  }

  function toggleApiMetrics() {
    isApiMetricsExpanded = !isApiMetricsExpanded;
  }

  function toggleRbac() {
    isRbacExpanded = !isRbacExpanded;
  }

  function toggleAccountAccess() {
    isAccountAccessExpanded = !isAccountAccessExpanded;
  }

  function toggleDynamicEntities() {
    isDynamicEntitiesExpanded = !isDynamicEntitiesExpanded;
  }

  function toggleAbac() {
    isAbacExpanded = !isAbacExpanded;
  }

  // Some items in the menu are rendered conditionally based on the presence of URLs set in the environment variables.
  // This is to ensure no broken links
  let menuItems = $state([
    ...(data.externalLinks.API_EXPLORER_URL
      ? [
          {
            href: data.externalLinks.API_EXPLORER_URL,
            label: "API Explorer",
            iconComponent: Compass,
            external: true,
          },
        ]
      : []), // unpacks a conditional list so we can add menu items where we want
    ...(data.externalLinks.PORTAL_URL
      ? [
          {
            href: data.externalLinks.PORTAL_URL,
            label: "Portal",
            iconComponent: Globe,
            external: true,
          },
        ]
      : []),
    {
      label: "Users",
      href: "/users",
      iconComponent: Users,
    },
    {
      label: "Consumers",
      href: "/consumers",
      iconComponent: KeyRound,
    },

    ...(data.externalLinks.SUBSCRIPTIONS_URL
      ? [
          {
            href: data.externalLinks.SUBSCRIPTIONS_URL,
            label: "Subscriptions",
            iconComponent: CreditCard,
            external: true,
          },
        ]
      : []),
    // ...(data.SUBSCRIPTIONS_URL
    // 	? [{ href: data.SUBSCRIPTIONS_URL, label: 'Subscriptions', iconComponent: Star }]
    // 	: []),
    //{ label: 'Onboarding', href: '/intro', iconComponent: UserPlus },
    //{ label: 'Consent Simulator', href: '/hola', iconComponent: ShieldUser },
    //{ label: 'FAQs', href: '/faq', iconComponent: MessageCircleQuestion },
    ...(data.externalLinks.API_MANAGER_URL
      ? [
          {
            href: data.externalLinks.API_MANAGER_URL,
            label: "API Manager",
            iconComponent: SquareTerminal,
            external: true,
          },
        ]
      : []),
  ]);

  let footerLinks = $state([
    //{ href: '/privacy', label: 'Privacy Policy' },
    {
      href: "https://github.com/OpenBankProject",
      label: "GitHub",
    },
  ]); //{ href: '/terms', label: 'Terms of Service' },

  //{ href: '/support', label: 'Support' },
  //{ href: '/sitemap', label: 'Sitemap' }

  // Default logo URL, can be overridden by PUBLIC_LOGO_URL in .env
  const defaultLogoUrl = "/logo2x-1.png";
  const defaultDarkLogoUrl = "/obp_logo.png";
  let lightLogoUrl = $state(env.PUBLIC_LOGO_URL || defaultLogoUrl);

  if (!env.PUBLIC_DARK_LOGO_URL) {
    // If no dark logo URL is provided, use the same as light logo
    env.PUBLIC_DARK_LOGO_URL = env.PUBLIC_LOGO_URL || defaultLogoUrl;
  }

  let darkLogoUrl = $state(env.PUBLIC_DARK_LOGO_URL || defaultDarkLogoUrl);

  let logoUrl = $derived.by(() => {
    return displayMode === "dark" ? darkLogoUrl : lightLogoUrl;
  });
</script>

<div
  class="grid min-h-screen w-full grid-cols-[auto_1fr] divide-x divide-solid divide-surface-100-900"
>
  <div class="sticky top-0 h-screen">
    <Navigation
      layout="sidebar"
      class="grid h-full grid-rows-[auto_1fr_auto] gap-4 preset-filled-primary-50-950"
    >
      <Navigation.Header class="p-4">
        <a href="/" class="flex w-full items-center">
          <img class="block w-full" src={logoUrl} alt="Logo" />
        </a>
      </Navigation.Header>

      <Navigation.Content class="">
        <!-- Main Menu Group -->
        <Navigation.Group>
          <Navigation.Menu class="flex flex-col gap-2 px-2">
            {#each menuItems as item}
              {@const Icon = item.iconComponent}
              <a
                href={item.href}
                class="btn w-full justify-start gap-3 px-2 hover:preset-tonal"
                class:preset-filled-primary-50-950={page.url.pathname ===
                  item.href}
                class:border={page.url.pathname === item.href}
                class:border-solid-secondary-500={page.url.pathname ===
                  item.href}
                title={item.label}
                aria-label={item.label}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
              >
                <Icon class="size-5" />
                <span>{item.label}</span>
              </a>
            {/each}
          </Navigation.Menu>
        </Navigation.Group>

        {#if isAuthenticated}
          <!-- My Account Group -->
          <Navigation.Group>
            <button
              type="button"
              class="btn w-full justify-start gap-3 px-2 hover:preset-tonal"
              class:preset-filled-primary-50-950={isMyAccountActive}
              class:border={isMyAccountActive}
              class:border-solid-secondary-500={isMyAccountActive}
              onclick={toggleMyAccount}
            >
              <User class="size-5" />
              <span>My Account</span>
              {#if isMyAccountExpanded}
                <ChevronDown class="h-4 w-4" />
              {:else}
                <ChevronRight class="h-4 w-4" />
              {/if}
            </button>

            {#if isMyAccountExpanded}
              <Navigation.Menu class="mt-1 ml-4 flex flex-col gap-1 px-2">
                {#each myAccountItems as subItem}
                  {@const Icon = subItem.iconComponent}
                  <a
                    href={subItem.href}
                    class="btn w-full justify-start gap-3 px-2 pl-6 text-sm hover:preset-tonal"
                    class:preset-filled-secondary-50-950={page.url.pathname ===
                      subItem.href}
                    class:border-l-2={page.url.pathname === subItem.href}
                    class:border-primary-500={page.url.pathname ===
                      subItem.href}
                    title={subItem.label}
                    aria-label={subItem.label}
                    target={subItem.external ? "_blank" : undefined}
                    rel={subItem.external ? "noopener noreferrer" : undefined}
                  >
                    <Icon class="size-4" />
                    <span>{subItem.label}</span>
                  </a>
                {/each}
              </Navigation.Menu>
            {/if}
          </Navigation.Group>

          <!-- System Group -->
          <Navigation.Group>
            <button
              type="button"
              class="btn w-full justify-start gap-3 px-2 hover:preset-tonal"
              class:preset-filled-primary-50-950={isSystemActive}
              class:border={isSystemActive}
              class:border-solid-secondary-500={isSystemActive}
              onclick={toggleSystem}
            >
              <Server class="size-5" />
              <span>System</span>
              {#if isSystemExpanded}
                <ChevronDown class="h-4 w-4" />
              {:else}
                <ChevronRight class="h-4 w-4" />
              {/if}
            </button>

            {#if isSystemExpanded}
              <Navigation.Menu class="mt-1 ml-4 flex flex-col gap-1 px-2">
                {#each systemItems as subItem}
                  {@const Icon = subItem.iconComponent}
                  <a
                    href={subItem.href}
                    class="btn w-full justify-start gap-3 px-2 pl-6 text-sm hover:preset-tonal"
                    class:preset-filled-secondary-50-950={page.url.pathname ===
                      subItem.href}
                    class:border-l-2={page.url.pathname === subItem.href}
                    class:border-primary-500={page.url.pathname ===
                      subItem.href}
                    title={subItem.label}
                    aria-label={subItem.label}
                    target={subItem.external ? "_blank" : undefined}
                    rel={subItem.external ? "noopener noreferrer" : undefined}
                  >
                    <Icon class="size-4" />
                    <span>{subItem.label}</span>
                  </a>
                {/each}
              </Navigation.Menu>
            {/if}
          </Navigation.Group>

          <!-- Integration Group -->
          <Navigation.Group>
            <button
              type="button"
              class="btn w-full justify-start gap-3 px-2 hover:preset-tonal"
              class:preset-filled-primary-50-950={isIntegrationActive}
              class:border={isIntegrationActive}
              class:border-solid-secondary-500={isIntegrationActive}
              onclick={toggleIntegration}
            >
              <Plug class="size-5" />
              <span>Integration</span>
              {#if isIntegrationExpanded}
                <ChevronDown class="h-4 w-4" />
              {:else}
                <ChevronRight class="h-4 w-4" />
              {/if}
            </button>

            {#if isIntegrationExpanded}
              <Navigation.Menu class="mt-1 ml-4 flex flex-col gap-1 px-2">
                {#each integrationItems as subItem}
                  {@const Icon = subItem.iconComponent}
                  <a
                    href={subItem.href}
                    class="btn w-full justify-start gap-3 px-2 pl-6 text-sm hover:preset-tonal"
                    class:preset-filled-secondary-50-950={page.url.pathname ===
                      subItem.href}
                    class:border-l-2={page.url.pathname === subItem.href}
                    class:border-primary-500={page.url.pathname ===
                      subItem.href}
                    title={subItem.label}
                    aria-label={subItem.label}
                    target={subItem.external ? "_blank" : undefined}
                    rel={subItem.external ? "noopener noreferrer" : undefined}
                  >
                    <Icon class="size-4" />
                    <span>{subItem.label}</span>
                  </a>
                {/each}
              </Navigation.Menu>
            {/if}
          </Navigation.Group>

          <!-- API Metrics Group -->
          <Navigation.Group>
            <button
              type="button"
              class="btn w-full justify-start gap-3 px-2 hover:preset-tonal"
              class:preset-filled-primary-50-950={isApiMetricsActive}
              class:border={isApiMetricsActive}
              class:border-solid-secondary-500={isApiMetricsActive}
              onclick={toggleApiMetrics}
            >
              <BarChart3 class="size-5" />
              <span>API Metrics</span>
              {#if isApiMetricsExpanded}
                <ChevronDown class="h-4 w-4" />
              {:else}
                <ChevronRight class="h-4 w-4" />
              {/if}
            </button>

            {#if isApiMetricsExpanded}
              <Navigation.Menu class="mt-1 ml-4 flex flex-col gap-1 px-2">
                {#each apiMetricsItems as subItem}
                  {@const Icon = subItem.iconComponent}
                  <a
                    href={subItem.href}
                    class="btn w-full justify-start gap-3 px-2 pl-6 text-sm hover:preset-tonal"
                    class:preset-filled-secondary-50-950={page.url.pathname ===
                      subItem.href}
                    class:border-l-2={page.url.pathname === subItem.href}
                    class:border-primary-500={page.url.pathname ===
                      subItem.href}
                    title={subItem.label}
                    aria-label={subItem.label}
                    target={subItem.external ? "_blank" : undefined}
                    rel={subItem.external ? "noopener noreferrer" : undefined}
                  >
                    <Icon class="size-4" />
                    <span>{subItem.label}</span>
                  </a>
                {/each}
              </Navigation.Menu>
            {/if}
          </Navigation.Group>

          <!-- ABAC Section -->
          <Navigation.Group>
            <button
              type="button"
              class="btn w-full justify-start gap-3 px-2 hover:preset-tonal"
              class:preset-filled-primary-50-950={isAbacActive}
              class:border={isAbacActive}
              class:border-solid-secondary-500={isAbacActive}
              onclick={toggleAbac}
            >
              <Lock class="size-5" />
              <span>ABAC</span>
              {#if isAbacExpanded}
                <ChevronDown class="h-4 w-4" />
              {:else}
                <ChevronRight class="h-4 w-4" />
              {/if}
            </button>

            {#if isAbacExpanded}
              <Navigation.Menu class="mt-1 ml-4 flex flex-col gap-1 px-2">
                {#each abacItems as subItem}
                  {@const Icon = subItem.iconComponent}
                  <a
                    href={subItem.href}
                    class="btn w-full justify-start gap-3 px-2 pl-6 text-sm hover:preset-tonal"
                    class:preset-filled-secondary-50-950={page.url.pathname ===
                      subItem.href}
                    class:border-l-2={page.url.pathname === subItem.href}
                    class:border-primary-500={page.url.pathname ===
                      subItem.href}
                    title={subItem.label}
                    aria-label={subItem.label}
                    target={subItem.external ? "_blank" : undefined}
                    rel={subItem.external ? "noopener noreferrer" : undefined}
                  >
                    <Icon class="size-4" />
                    <span>{subItem.label}</span>
                  </a>
                {/each}
              </Navigation.Menu>
            {/if}
          </Navigation.Group>

          <!-- RBAC Group -->
          <Navigation.Group>
            <button
              type="button"
              class="btn w-full justify-start gap-3 px-2 hover:preset-tonal"
              class:preset-filled-primary-50-950={isRbacActive}
              class:border={isRbacActive}
              class:border-solid-secondary-500={isRbacActive}
              onclick={toggleRbac}
            >
              <Shield class="size-5" />
              <span>RBAC</span>
              {#if isRbacExpanded}
                <ChevronDown class="h-4 w-4" />
              {:else}
                <ChevronRight class="h-4 w-4" />
              {/if}
            </button>

            {#if isRbacExpanded}
              <Navigation.Menu class="mt-1 ml-4 flex flex-col gap-1 px-2">
                {#each rbacItems as subItem}
                  {@const Icon = subItem.iconComponent}
                  <a
                    href={subItem.href}
                    class="btn w-full justify-start gap-3 px-2 pl-6 text-sm hover:preset-tonal"
                    class:preset-filled-secondary-50-950={page.url.pathname ===
                      subItem.href}
                    class:border-l-2={page.url.pathname === subItem.href}
                    class:border-primary-500={page.url.pathname ===
                      subItem.href}
                    title={subItem.label}
                    aria-label={subItem.label}
                    target={subItem.external ? "_blank" : undefined}
                    rel={subItem.external ? "noopener noreferrer" : undefined}
                  >
                    <Icon class="size-4" />
                    <span>{subItem.label}</span>
                  </a>
                {/each}
              </Navigation.Menu>
            {/if}
          </Navigation.Group>

          <!-- Account Access Group -->
          <Navigation.Group>
            <button
              type="button"
              class="btn w-full justify-start gap-3 px-2 hover:preset-tonal"
              class:preset-filled-primary-50-950={isAccountAccessActive}
              class:border={isAccountAccessActive}
              class:border-solid-secondary-500={isAccountAccessActive}
              onclick={toggleAccountAccess}
            >
              <Landmark class="size-5" />
              <span>Account Access</span>
              {#if isAccountAccessExpanded}
                <ChevronDown class="h-4 w-4" />
              {:else}
                <ChevronRight class="h-4 w-4" />
              {/if}
            </button>

            {#if isAccountAccessExpanded}
              <Navigation.Menu class="mt-1 ml-4 flex flex-col gap-1 px-2">
                {#each accountAccessItems as subItem}
                  {@const Icon = subItem.iconComponent}
                  <a
                    href={subItem.href}
                    class="btn w-full justify-start gap-3 px-2 pl-6 text-sm hover:preset-tonal"
                    class:preset-filled-secondary-50-950={page.url.pathname ===
                      subItem.href}
                    class:border-l-2={page.url.pathname === subItem.href}
                    class:border-primary-500={page.url.pathname ===
                      subItem.href}
                    title={subItem.label}
                    aria-label={subItem.label}
                  >
                    <Icon class="size-4" />
                    <span>{subItem.label}</span>
                  </a>
                {/each}
              </Navigation.Menu>
            {/if}
          </Navigation.Group>

          <!-- Dynamic Entities Group -->
          <Navigation.Group>
            <button
              type="button"
              class="btn w-full justify-start gap-3 px-2 hover:preset-tonal"
              class:preset-filled-primary-50-950={isDynamicEntitiesActive}
              class:border={isDynamicEntitiesActive}
              class:border-solid-secondary-500={isDynamicEntitiesActive}
              onclick={toggleDynamicEntities}
            >
              <Box class="size-5" />
              <span>Dynamic Entities</span>
              {#if isDynamicEntitiesExpanded}
                <ChevronDown class="h-4 w-4" />
              {:else}
                <ChevronRight class="h-4 w-4" />
              {/if}
            </button>

            {#if isDynamicEntitiesExpanded}
              <Navigation.Menu class="mt-1 ml-4 flex flex-col gap-1 px-2">
                {#each dynamicEntitiesItems as subItem}
                  {@const Icon = subItem.iconComponent}
                  <a
                    href={subItem.href}
                    class="btn w-full justify-start gap-3 px-2 pl-6 text-sm hover:preset-tonal"
                    class:preset-filled-secondary-50-950={page.url.pathname ===
                      subItem.href}
                    class:border-l-2={page.url.pathname === subItem.href}
                    class:border-primary-500={page.url.pathname ===
                      subItem.href}
                    title={subItem.label}
                    aria-label={subItem.label}
                  >
                    <Icon class="size-4" />
                    <span>{subItem.label}</span>
                  </a>
                {/each}
              </Navigation.Menu>
            {/if}
          </Navigation.Group>
        {/if}
      </Navigation.Content>

      <Navigation.Footer class="p-4">
        <div
          class="flex flex-wrap items-center gap-3 text-xs text-surface-800-200"
        >
          <LightSwitch bind:mode={displayMode} />
          {#each footerLinks as link, index}
            <a
              href={link.href}
              class="flex items-center gap-2 hover:text-tertiary-400"
            >
              {#if link.label === "GitHub"}
                <img
                  class="h-4"
                  alt="github logo"
                  src={displayMode === "dark"
                    ? "/github-mark-white.svg"
                    : "/github-mark.svg"}
                />
              {/if}
              {link.label}
            </a>
          {/each}
          <button
            onclick={clearCache}
            class="flex items-center gap-1 hover:text-tertiary-400 cursor-pointer"
            title="Clear browser cache and reload"
          >
            ⚡
          </button>
          <span> © TESOBE 2011-2025 </span>
          {#if data.externalLinks.LEGACY_PORTAL_URL}
            <!-- Legacy Portal Link -->
            <a
              href={data.externalLinks.LEGACY_PORTAL_URL}
              class="w-full justify-start text-xs text-tertiary-700-300 hover:underline"
              aria-label="Switch to Legacy Portal"
            >
              <span>Switch to Legacy Portal</span>
            </a>
          {/if}
        </div>
      </Navigation.Footer>
    </Navigation>
  </div>
  <div
    class="h-full bg-conic-250 from-30% via-40% to-50% dark:from-primary-950 dark:via-tertiary-500/70 dark:to-primary-950"
  >
    <div
      class="flex flex-col backdrop-blur-2xl"
      style="height: calc(100vh - 80px);"
    >
      <div
        class="bg-opacity-0 flex items-center justify-end p-4"
        style="height: 80px; flex-shrink: 0;"
      >
        {#if isAuthenticated}
          <span class="mx-4 hover:text-tertiary-400"
            ><a href="/user">{data.username}</a></span
          >
          <button type="button" class="btn preset-outlined-primary-500"
            ><a href="/logout">Logout</a></button
          >
        {:else}
          <span class="mx-4 hover:text-tertiary-400"
            ><a href="{data.externalLinks.PORTAL_URL}/register">Register</a>
          </span>
          <button type="button" class="btn preset-filled-surface-950-50"
            ><a href="/login">Login</a></button
          >
        {/if}
      </div>

      <main
        class="flex flex-col overflow-auto"
        style="height: calc(100vh - 80px);"
      >
        {@render children()}
      </main>
    </div>
  </div>
</div>

<!-- Global Toast Component -->
<Toast />

<!-- Global API Activity Indicator -->
<ApiActivityIndicator />
