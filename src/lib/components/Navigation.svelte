<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  // Props from layout with better typing
  export let user: {
    username?: string;
    email?: string;
    user_id?: string;
  } | null = null;
  export let authInfo: {
    source?: "obp_api" | "oidc_fallback";
    sourceDescription?: string;
  } | null = null;

  // Reactive statements for better state management
  $: isAuthenticated = !!user;
  $: isLimitedAccess = authInfo?.source === "oidc_fallback";
  $: userDisplayName = user?.username || user?.email || "User";

  let isMobileMenuOpen = false;

  // Navigation items for authenticated users - computed based on access level
  $: navigationItems = isAuthenticated
    ? [
        { href: "/", label: "Home", icon: "🏠", available: true },
        {
          href: "/management",
          label: "Management",
          icon: "⚙️",
          available: !isLimitedAccess,
        },
        {
          href: "/management/api",
          label: "API",
          icon: "🔌",
          available: !isLimitedAccess,
        },
        {
          href: "/management/metrics",
          label: "Metrics",
          icon: "📊",
          available: !isLimitedAccess,
        },
      ].filter((item) => item.available)
    : [];

  // Reactive check for active route
  $: isActiveRoute = (href: string): boolean => {
    if (href === "/") {
      return $page.url.pathname === "/";
    }
    return $page.url.pathname.startsWith(href);
  };

  // Event handlers with better encapsulation
  const handlers = {
    toggleMobileMenu: () => (isMobileMenuOpen = !isMobileMenuOpen),
    navigate: (path: string) => {
      goto(path);
      isMobileMenuOpen = false;
    },
    logout: () => handlers.navigate("/logout"),
    login: () => handlers.navigate("/login"),
  };
</script>

<!-- Navigation Bar -->
<nav class="nav-container">
  <div class="nav-content">
    <!-- Logo/Brand -->
    <div class="nav-brand">
      <a href="/" class="brand-link">
        <span class="brand-text">API Manager II</span>
      </a>
    </div>

    <!-- Desktop Navigation -->
    <div class="nav-links desktop-only">
      {#if isAuthenticated}
        {#each navigationItems as item}
          <a
            href={item.href}
            class="nav-link"
            class:active={isActiveRoute(item.href)}
          >
            <span class="nav-icon">{item.icon}</span>
            {item.label}
          </a>
        {/each}
      {/if}
    </div>

    <!-- User Actions -->
    <div class="nav-actions">
      {#if isAuthenticated}
        <!-- User Info -->
        <div class="user-info desktop-only">
          <span class="user-name">{userDisplayName}</span>
          <span
            class="auth-status"
            class:limited={isLimitedAccess}
            class:full={!isLimitedAccess}
          >
            {isLimitedAccess ? "Limited" : "Full Access"}
          </span>
        </div>

        <!-- Logout Button -->
        <button class="btn btn-logout desktop-only" on:click={handlers.logout}>
          Logout
        </button>
      {:else}
        <!-- Login Button -->
        <button class="btn btn-login desktop-only" on:click={handlers.login}>
          Login
        </button>
      {/if}

      <!-- Mobile Menu Button (Hamburger) -->
      <button
        class="hamburger mobile-only"
        class:open={isMobileMenuOpen}
        on:click={handlers.toggleMobileMenu}
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
          <div class="mobile-auth-status">
            <span
              class="auth-status"
              class:limited={isLimitedAccess}
              class:full={!isLimitedAccess}
            >
              {isLimitedAccess ? "Limited Access" : "Full Access"}
            </span>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="mobile-nav-links">
          {#each navigationItems as item}
            <button
              class="mobile-nav-link"
              class:active={isActiveRoute(item.href)}
              on:click={() => handlers.navigate(item.href)}
            >
              <span class="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          {/each}
        </div>

        <!-- Logout Button -->
        <button class="mobile-logout-btn" on:click={handlers.logout}>
          Logout
        </button>
      {:else}
        <!-- Login Button for Mobile -->
        <button class="mobile-login-btn" on:click={handlers.login}>
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
    gap: 0.5rem;
  }

  .user-name {
    color: #374151;
    font-weight: 500;
    font-size: 0.875rem;
  }

  .auth-status {
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 9999px;
    text-transform: uppercase;
  }

  .auth-status.full {
    background-color: #d1fae5;
    color: #065f46;
  }

  .auth-status.limited {
    background-color: #fef3c7;
    color: #92400e;
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
    margin-bottom: 0.5rem;
  }

  .mobile-auth-status {
    display: flex;
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
  }
</style>
