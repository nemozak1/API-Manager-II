<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import AuthStatus from "$lib/components/AuthStatus.svelte";
  import AuthNotification from "$lib/components/AuthNotification.svelte";

  // Check if user is logged in (this will be set by the layout)
  export let data: any = {};
  $: user = data?.user;
  $: authInfo = data?.authInfo;

  const availablePages = [
    {
      path: "/",
      title: "Home",
      description: "Main dashboard and overview",
      status: "active",
    },
    {
      path: "/login",
      title: "Login",
      description: "Authentication with Open Bank Project",
      status: "active",
    },
  ];

  function navigateToPage(path: string, status: string) {
    if (status === "active") {
      goto(path);
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <header class="text-center mb-12">
    <h1 class="text-4xl font-bold text-gray-800 mb-4">API Manager II</h1>
    <p class="text-lg text-gray-600">
      Comprehensive API management and monitoring platform
    </p>
    {#if user}
      <!-- Show notification for fallback authentication -->
      {#if authInfo?.source === "oidc_fallback"}
        <AuthNotification
          type="warning"
          title="Limited Access Mode"
          message="OBP API server is not accessible. Some features may be unavailable."
          dismissible={true}
        />
      {/if}

      {#if authInfo?.source === "obp_api"}
        <AuthNotification
          type="success"
          title="Full OBP Access Active"
          message="Connected to OBP API server with full banking data access."
          autoClose={true}
          duration={4000}
        />
      {/if}

      <AuthStatus {user} {authInfo} />
      <div class="mt-4 text-center">
        <button
          class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          on:click={() => goto("/logout")}
        >
          Logout
        </button>
      </div>
    {:else}
      <div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p class="text-blue-800 mb-2">
          Please login to access protected features
        </p>
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          on:click={() => goto("/login")}
        >
          Login
        </button>
      </div>
    {/if}
  </header>

  <section class="mb-12">
    <h2 class="text-2xl font-semibold text-gray-700 mb-6">
      Available Features
    </h2>

    <!-- Full OBP Access Features -->
    {#if authInfo?.source === "obp_api"}
      <div class="mb-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
        <h3 class="text-lg font-semibold text-green-800 mb-2">
          🏦 Full Banking Features Available
        </h3>
        <p class="text-green-700 text-sm mb-4">
          You have full access to OBP API features and banking data.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="feature-card available">
            <div class="feature-icon">💰</div>
            <h4 class="feature-title">Account Management</h4>
            <p class="feature-desc">View and manage bank accounts</p>
            <span class="feature-status available">Available</span>
          </div>

          <div class="feature-card available">
            <div class="feature-icon">📊</div>
            <h4 class="feature-title">Transaction History</h4>
            <p class="feature-desc">Full transaction data and analytics</p>
            <span class="feature-status available">Available</span>
          </div>

          <div class="feature-card available">
            <div class="feature-icon">🏛️</div>
            <h4 class="feature-title">Bank Information</h4>
            <p class="feature-desc">Access to bank and branch data</p>
            <span class="feature-status available">Available</span>
          </div>

          <div class="feature-card available">
            <div class="feature-icon">👥</div>
            <h4 class="feature-title">User Management</h4>
            <p class="feature-desc">Complete user profile access</p>
            <span class="feature-status available">Available</span>
          </div>

          <div class="feature-card available">
            <div class="feature-icon">🔒</div>
            <h4 class="feature-title">API Access</h4>
            <p class="feature-desc">Full OBP API integration</p>
            <span class="feature-status available">Available</span>
          </div>

          <div class="feature-card available">
            <div class="feature-icon">📈</div>
            <h4 class="feature-title">Analytics & Reports</h4>
            <p class="feature-desc">Advanced banking analytics</p>
            <span class="feature-status available">Available</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Limited Access Features -->
    {#if authInfo?.source === "oidc_fallback"}
      <div
        class="mb-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400"
      >
        <h3 class="text-lg font-semibold text-yellow-800 mb-2">
          ⚠️ Limited Access Mode
        </h3>
        <p class="text-yellow-700 text-sm mb-4">
          OBP API server is not accessible. Only basic features are available.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="feature-card limited">
            <div class="feature-icon">🔐</div>
            <h4 class="feature-title">Basic Authentication</h4>
            <p class="feature-desc">OIDC-based login only</p>
            <span class="feature-status limited">Limited</span>
          </div>

          <div class="feature-card limited">
            <div class="feature-icon">👤</div>
            <h4 class="feature-title">Basic Profile</h4>
            <p class="feature-desc">Limited user information</p>
            <span class="feature-status limited">Limited</span>
          </div>

          <div class="feature-card unavailable">
            <div class="feature-icon">💰</div>
            <h4 class="feature-title">Account Management</h4>
            <p class="feature-desc">Requires OBP API access</p>
            <span class="feature-status unavailable">Unavailable</span>
          </div>

          <div class="feature-card unavailable">
            <div class="feature-icon">📊</div>
            <h4 class="feature-title">Transaction History</h4>
            <p class="feature-desc">Requires OBP API access</p>
            <span class="feature-status unavailable">Unavailable</span>
          </div>

          <div class="feature-card unavailable">
            <div class="feature-icon">🏛️</div>
            <h4 class="feature-title">Banking Data</h4>
            <p class="feature-desc">Requires OBP API access</p>
            <span class="feature-status unavailable">Unavailable</span>
          </div>

          <div class="feature-card unavailable">
            <div class="feature-icon">📈</div>
            <h4 class="feature-title">Analytics</h4>
            <p class="feature-desc">Requires OBP API access</p>
            <span class="feature-status unavailable">Unavailable</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Current Pages Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each availablePages as page}
        <div
          class="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
          class:opacity-50={page.status !== "active"}
          class:cursor-not-allowed={page.status !== "active"}
          on:click={() => navigateToPage(page.path, page.status)}
          on:keydown={(e) =>
            e.key === "Enter" && navigateToPage(page.path, page.status)}
          role="button"
          tabindex="0"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xl font-semibold text-gray-800">{page.title}</h3>
            <span
              class="px-2 py-1 rounded-full text-xs font-medium"
              class:bg-green-100={page.status === "active"}
              class:text-green-800={page.status === "active"}
              class:bg-yellow-100={page.status === "planned"}
              class:text-yellow-800={page.status === "planned"}
            >
              {page.status === "active" ? "Available" : "Coming Soon"}
            </span>
          </div>
          <p class="text-gray-600 text-sm">{page.description}</p>
          <div class="mt-4 pt-4 border-t border-gray-100">
            <span class="text-xs text-gray-500">Route: {page.path}</span>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section class="bg-blue-50 rounded-lg p-6">
    <h2 class="text-xl font-semibold text-blue-800 mb-4">Getting Started</h2>
    <div class="text-blue-700">
      <p class="mb-3">
        Welcome to API Manager II! This application provides comprehensive API
        management capabilities with secure OAuth 2.0 authentication through
        Open Bank Project.
      </p>
      {#if !user}
        <p class="mb-3">
          <strong>Authentication System:</strong> Login functionality has been successfully
          implemented. Please authenticate with your Open Bank Project credentials
          to access protected features.
        </p>
      {:else}
        <p class="mb-3">
          <strong>Welcome back!</strong> You are successfully authenticated and can
          access all available features.
        </p>
      {/if}
      <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
        <li>OAuth 2.0/OIDC authentication with OBP</li>
        <li>Session management with Redis</li>
        <li>Secure token handling and refresh</li>
        <li>Protected routes with automatic redirects</li>
      </ul>
      <p class="mt-4 text-sm">
        <strong>Status:</strong> Authentication system is fully operational.
        {user ? "You are logged in and ready to go!" : "Ready for login."}
      </p>
    </div>
  </section>

  <footer class="text-center mt-12 pt-8 border-t border-gray-200">
    <p class="text-gray-500 text-sm">Built with SvelteKit • Version 0.0.1</p>
  </footer>
</div>

<style>
  .container {
    max-width: 1200px;
  }

  .feature-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .feature-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .feature-card.available {
    border-left: 4px solid #10b981;
    background: #f0fdf4;
  }

  .feature-card.limited {
    border-left: 4px solid #f59e0b;
    background: #fffbeb;
  }

  .feature-card.unavailable {
    border-left: 4px solid #ef4444;
    background: #fef2f2;
    opacity: 0.7;
  }

  .feature-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .feature-title {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .feature-desc {
    color: #6b7280;
    font-size: 0.75rem;
    margin-bottom: 0.75rem;
    line-height: 1.4;
  }

  .feature-status {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    display: inline-block;
  }

  .feature-status.available {
    background-color: #d1fae5;
    color: #065f46;
  }

  .feature-status.limited {
    background-color: #fef3c7;
    color: #92400e;
  }

  .feature-status.unavailable {
    background-color: #fee2e2;
    color: #991b1b;
  }

  @media (max-width: 768px) {
    .feature-card {
      padding: 0.75rem;
    }

    .feature-icon {
      font-size: 1.25rem;
    }
  }
</style>
