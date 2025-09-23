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
  <header class="text-center mb-8">
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
          🏦 Full OBP API Access Active
        </h3>
        <p class="text-green-700 text-sm mb-4">
          You have authenticated with the OBP API server and can access the
          management console.
        </p>
        <div class="mt-4">
          <button
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            on:click={() => goto("/management")}
          >
            Access Management Console
          </button>
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
          OBP API server is not accessible. You are authenticated via OIDC but
          cannot access banking features.
        </p>
        <p class="text-yellow-700 text-sm">
          Please check your OBP API server connection to access the full
          management console.
        </p>
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
</div>

<style>
  .container {
    max-width: 1200px;
  }

  @media (max-width: 768px) {
    .container {
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }
</style>
