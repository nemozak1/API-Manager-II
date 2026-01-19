<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { env } from "$env/dynamic/public";

  // Props from layout with better typing
  let {
    user = null,
    authInfo = null,
  }: {
    user?: {
      username?: string;
      email?: string;
      user_id?: string;
    } | null;
    authInfo?: {
      authenticated?: boolean;
    } | null;
  } = $props();

  // Reactive statements for better state management
  let isAuthenticated = $derived(!!user && !!authInfo?.authenticated);
  let userDisplayName = $derived(user?.username || user?.email || "User");
  
  // Configuration - extract display name from URL
  function getDisplayName(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.hostname}:${parsed.port || (parsed.protocol === 'https:' ? '443' : '80')}`;
    } catch {
      return url;
    }
  }
  
  let obpDisplayName = $derived(getDisplayName(env.PUBLIC_OBP_BASE_URL || "http://127.0.0.1:8080"));

  let isMobileMenuOpen = $state(false);
  let openDropdown = $state<string | null>(null);

  // Navigation items for authenticated users - computed based on access level
  let navigationItems = $derived(
    isAuthenticated
      ? [
          { href: "/", label: "Home", icon: "🏠", available: true },

          {
            href: "/metrics",
            label: "Metrics",
            icon: "📊",
            available: true,
          },
          {
            label: "Dynamic Entities",
            icon: "🔷",
            available: true,
            subItems: [
              {
                href: "/dynamic-entities/system",
                label: "System Dynamic Entities",
                icon: "⚙️",
              },
              {
                href: "/dynamic-entities/create",
                label: "Create Dynamic Entity",
                icon: "➕",
              },
              {
                href: "/dynamic-entities/definitions",
                label: "Dynamic Entity Definitions",
                icon: "📋",
              },
            ],
          },
        ].filter((item) => item.available)
      : [],
  );

  // Reactive check for active route
  function isActiveRoute(href: string): boolean {
    if (href === "/") {
      return $page.url.pathname === "/";
    }
    return $page.url.pathname.startsWith(href);
  }

  // Event handlers with better encapsulation
  const handlers = {
    toggleMobileMenu: () => {
      isMobileMenuOpen = !isMobileMenuOpen;
    },
    navigate: (path: string) => {
      goto(path);
      isMobileMenuOpen = false;
      openDropdown = null;
    },
    toggleDropdown: (label: string) => {
      openDropdown = openDropdown === label ? null : label;
    },
    closeDropdown: () => {
      openDropdown = null;
    },
    logout: () => handlers.navigate("/logout"),
    login: () => handlers.navigate("/login"),
    clearCache: async () => {
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
    },
  };
</script>

<!-- Navigation Bar -->
<nav class="nav-container">
  <div class="nav-content">
    <!-- Logo/Brand -->
    <div class="nav-brand">
      <a href="/" class="brand-link">
        <span class="brand-text">API Manager II</span>
        <span class="brand-version">v0.0.1</span>
      </a>
    </div>

    <!-- Desktop Navigation -->
    <div class="nav-links desktop-only">
      {#if isAuthenticated}
        {#each navigationItems as item}
          {#if item.subItems && item.subItems.length > 0}
            <!-- Dropdown menu item -->
            <div class="nav-dropdown">
              <button
                class="nav-link dropdown-toggle"
                class:active={isActiveRoute(item.href)}
                onclick={() => handlers.toggleDropdown(item.label)}
                onblur={() => setTimeout(handlers.closeDropdown, 200)}
              >
                <span class="nav-icon">{item.icon}</span>
                {item.label}
                <span class="dropdown-arrow"
                  >{openDropdown === item.label ? "▲" : "▼"}</span
                >
              </button>
              {#if openDropdown === item.label}
                <div class="dropdown-menu">
                  {#each item.subItems as subItem}
                    <a
                      href={subItem.href}
                      class="dropdown-item"
                      class:active={isActiveRoute(subItem.href)}
                      onclick={handlers.closeDropdown}
                    >
                      <span class="nav-icon">{subItem.icon}</span>
                      {subItem.label}
                    </a>
                  {/each}
                </div>
              {/if}
            </div>
          {:else}
            <!-- Regular menu item -->
            <a
              href={item.href}
              class="nav-link"
              class:active={isActiveRoute(item.href)}
            >
              <span class="nav-icon">{item.icon}</span>
              {item.label}
            </a>
          {/if}
        {/each}
      {/if}
    </div>

    <!-- User Actions -->
    <div class="nav-actions">
      {#if isAuthenticated}
        <!-- User Info -->
        <div class="user-info desktop-only">
          <div class="user-details">
            <span class="user-name">{userDisplayName}</span>
            <span class="obp-host">→ {obpDisplayName}</span>
          </div>
        </div>

        <!-- Clear Cache Button -->
        <button
          class="btn btn-cache desktop-only"
          onclick={handlers.clearCache}
          title="Clear browser cache and reload"
        >
          ⚡
        </button>

        <!-- Logout Button -->
        <button class="btn btn-logout desktop-only" onclick={handlers.logout}>
          Logout
        </button>
      {:else}
        <!-- Login Button -->
        <button class="btn btn-login desktop-only" onclick={handlers.login}>
          Login
        </button>
      {/if}

      <!-- Mobile Menu Button (Hamburger) -->
      <button
        class="hamburger mobile-only"
        class:open={isMobileMenuOpen}
        onclick={handlers.toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </div>

  <!-- Mobile Menu -->
  {#if isMobileMenuOpen}
    <div class="mobile-menu">
      {#if isAuthenticated}
        <!-- User Info in Mobile -->
        <div class="mobile-user-info">
          <div class="mobile-user-name">{userDisplayName}</div>
          <div class="mobile-obp-host">Connected to: {obpDisplayName}</div>
        </div>

        <!-- Navigation Links -->
        <div class="mobile-nav-links">
          {#each navigationItems as item}
            {#if item.subItems && item.subItems.length > 0}
              <!-- Mobile dropdown -->
              <div class="mobile-nav-dropdown">
                <button
                  class="mobile-nav-link"
                  class:active={isActiveRoute(item.href)}
                  onclick={() => handlers.toggleDropdown(item.label)}
                >
                  <span class="nav-icon">{item.icon}</span>
                  {item.label}
                  <span class="dropdown-arrow"
                    >{openDropdown === item.label ? "▲" : "▼"}</span
                  >
                </button>
                {#if openDropdown === item.label}
                  <div class="mobile-dropdown-items">
                    {#each item.subItems as subItem}
                      <button
                        class="mobile-nav-sublink"
                        class:active={isActiveRoute(subItem.href)}
                        onclick={() => handlers.navigate(subItem.href)}
                      >
                        <span class="nav-icon">{subItem.icon}</span>
                        {subItem.label}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            {:else}
              <!-- Regular mobile link -->
              <button
                class="mobile-nav-link"
                class:active={isActiveRoute(item.href)}
                onclick={() => handlers.navigate(item.href)}
              >
                <span class="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            {/if}
          {/each}
        </div>

        <!-- Clear Cache Button -->
        <button class="mobile-cache-btn" onclick={handlers.clearCache}>
          ⚡ Clear Cache & Reload
        </button>

        <!-- Logout Button -->
        <button class="mobile-logout-btn" onclick={handlers.logout}>
          Logout
        </button>
      {:else}
        <!-- Login Button for Mobile -->
        <button class="mobile-login-btn" onclick={handlers.login}>
          Login with OBP
        </button>
      {/if}
    </div>
  {/if}
</nav>

<style>
  .nav-container {
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .nav-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    height: 4rem;
  }

  /* Brand/Logo */
  .nav-brand {
    flex-shrink: 0;
  }

  .brand-link {
    text-decoration: none;
    color: #1f2937;
    font-weight: 700;
    font-size: 1.25rem;
  }

  .brand-text {
    color: #2563eb;
  }

  .brand-version {
    color: #6b7280;
    font-size: 0.75rem;
    font-weight: 400;
    margin-left: 0.5rem;
  }

  /* Desktop Navigation */
  .nav-links {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    flex-grow: 1;
    justify-content: center;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: #6b7280;
    font-weight: 500;
    border-radius: 0.5rem;
    transition: all 0.2s;
  }

  .nav-link:hover {
    color: #2563eb;
    background-color: #f3f4f6;
  }

  .nav-link.active {
    color: #2563eb;
    background-color: #dbeafe;
  }

  .nav-icon {
    font-size: 1rem;
  }

  /* Dropdown Navigation */
  .nav-dropdown {
    position: relative;
  }

  .dropdown-toggle {
    background: none;
    border: none;
    cursor: pointer;
    font-size: inherit;
    font-family: inherit;
  }

  .dropdown-arrow {
    font-size: 0.625rem;
    margin-left: 0.25rem;
    transition: transform 0.2s;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.5rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    min-width: 200px;
    z-index: 100;
    overflow: hidden;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    text-decoration: none;
    color: #6b7280;
    font-weight: 500;
    transition: all 0.2s;
    width: 100%;
    text-align: left;
  }

  .dropdown-item:hover {
    background-color: #f3f4f6;
    color: #2563eb;
  }

  .dropdown-item.active {
    background-color: #dbeafe;
    color: #2563eb;
  }

  /* User Actions */
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-details {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .user-name {
    color: #374151;
    font-weight: 500;
    font-size: 0.875rem;
    line-height: 1.2;
  }

  .obp-host {
    color: #6b7280;
    font-size: 0.75rem;
    font-family: monospace;
    line-height: 1.2;
  }

  /* Buttons */
  .btn {
    padding: 0.5rem 1rem;
    font-weight: 500;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .btn-login {
    background-color: #2563eb;
    color: white;
  }

  .btn-login:hover {
    background-color: #1d4ed8;
  }

  .btn-logout {
    background-color: #ef4444;
    color: white;
  }

  .btn-logout:hover {
    background-color: #dc2626;
  }

  .btn-cache {
    background-color: #6b7280;
    color: white;
    font-size: 1rem;
    padding: 0.5rem 0.75rem;
  }

  .btn-cache:hover {
    background-color: #4b5563;
  }

  /* Hamburger Menu */
  .hamburger {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    width: 1.5rem;
    height: 1.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .hamburger span {
    display: block;
    height: 2px;
    width: 100%;
    background-color: #374151;
    transition: all 0.3s;
    transform-origin: center;
  }

  .hamburger.open span:first-child {
    transform: rotate(45deg) translate(3px, 3px);
  }

  .hamburger.open span:nth-child(2) {
    opacity: 0;
  }

  .hamburger.open span:last-child {
    transform: rotate(-45deg) translate(4px, -4px);
  }

  /* Mobile Menu */
  .mobile-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 1rem;
  }

  .mobile-user-info {
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }

  .mobile-user-name {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .mobile-obp-host {
    color: #6b7280;
    font-size: 0.75rem;
    font-family: monospace;
    margin-bottom: 0.5rem;
  }

  .mobile-nav-links {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .mobile-nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 0.5rem;
    color: #6b7280;
    font-weight: 500;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .mobile-nav-link:hover,
  .mobile-nav-link.active {
    background-color: #f3f4f6;
    color: #2563eb;
  }

  /* Mobile Dropdown */
  .mobile-nav-dropdown {
    display: flex;
    flex-direction: column;
  }

  .mobile-nav-link .dropdown-arrow {
    margin-left: auto;
    font-size: 0.625rem;
  }

  .mobile-dropdown-items {
    display: flex;
    flex-direction: column;
    padding-left: 1rem;
    margin-top: 0.25rem;
  }

  .mobile-nav-sublink {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 0.5rem;
    color: #6b7280;
    font-weight: 500;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
    font-size: 0.875rem;
  }

  .mobile-nav-sublink:hover,
  .mobile-nav-sublink.active {
    background-color: #f3f4f6;
    color: #2563eb;
  }

  .mobile-logout-btn,
  .mobile-login-btn {
    width: 100%;
    padding: 0.75rem;
    font-weight: 600;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mobile-logout-btn {
    background-color: #ef4444;
    color: white;
  }

  .mobile-logout-btn:hover {
    background-color: #dc2626;
  }

  .mobile-login-btn {
    background-color: #2563eb;
    color: white;
  }

  .mobile-login-btn:hover {
    background-color: #1d4ed8;
  }

  .mobile-cache-btn {
    width: 100%;
    padding: 0.75rem;
    font-weight: 600;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    background-color: #6b7280;
    color: white;
    margin-bottom: 0.5rem;
  }

  .mobile-cache-btn:hover {
    background-color: #4b5563;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .desktop-only {
      display: none;
    }

    .mobile-only {
      display: flex;
    }

    .mobile-menu {
      display: block;
    }
  }

  @media (min-width: 769px) {
    .mobile-only {
      display: none;
    }

    .desktop-only {
      display: flex;
    }

    .mobile-menu {
      display: none !important;
    }
  }

  @media (max-width: 640px) {
    .nav-content {
      padding: 0 0.75rem;
    }

    .brand-text {
      font-size: 1.125rem;
    }

    .brand-version {
      font-size: 0.6rem;
      margin-left: 0.25rem;
    }
  }
</style>
