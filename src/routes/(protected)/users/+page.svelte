<script lang="ts">
  import type { PageData } from "./$types";

  let { data } = $props<{ data: PageData }>();

  let users = $derived(data.users || []);
  let hasApiAccess = $derived(data.hasApiAccess);
  let error = $derived(data.error);

  let emailQuery = $state("");
  let emailResults = $state<any[]>([]);
  let isSearchingEmail = $state(false);

  let userIdQuery = $state("");
  let userIdResult = $state<any | null>(null);
  let isSearchingUserId = $state(false);

  let providerQuery = $state("");
  let usernameQuery = $state("");
  let providerUsernameResult = $state<any | null>(null);
  let isSearchingProviderUsername = $state(false);

  async function searchByEmail() {
    if (!emailQuery.trim()) {
      emailResults = [];
      return;
    }

    isSearchingEmail = true;
    try {
      const response = await fetch(
        `/api/users/search-by-email?email=${encodeURIComponent(emailQuery)}`,
      );
      const result = await response.json();
      if (result.users) {
        emailResults = result.users;
      }
    } catch (err) {
      console.error("Email search error:", err);
    } finally {
      isSearchingEmail = false;
    }
  }

  async function searchByUserId() {
    if (!userIdQuery.trim()) {
      userIdResult = null;
      return;
    }

    isSearchingUserId = true;
    try {
      const response = await fetch(
        `/api/users/search-by-userid?user_id=${encodeURIComponent(userIdQuery)}`,
      );
      const result = await response.json();
      if (result.user) {
        userIdResult = result.user;
      } else {
        userIdResult = null;
      }
    } catch (err) {
      console.error("User ID search error:", err);
      userIdResult = null;
    } finally {
      isSearchingUserId = false;
    }
  }

  async function searchByProviderUsername() {
    if (!providerQuery.trim() || !usernameQuery.trim()) {
      providerUsernameResult = null;
      return;
    }

    isSearchingProviderUsername = true;
    try {
      const response = await fetch(
        `/api/users/search-by-provider-username?provider=${encodeURIComponent(providerQuery)}&username=${encodeURIComponent(usernameQuery)}`,
      );
      const result = await response.json();
      if (result.user) {
        providerUsernameResult = result.user;
      } else {
        providerUsernameResult = null;
      }
    } catch (err) {
      console.error("Provider/Username search error:", err);
      providerUsernameResult = null;
    } finally {
      isSearchingProviderUsername = false;
    }
  }

  function formatDate(dateString: string): string {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  }
</script>

<svelte:head>
  <title>Users - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Error Alert -->
  {#if error && !hasApiAccess}
    <div class="alert alert-error mb-6">
      <strong>Error:</strong>
      {error} - Unable to fetch users data.
    </div>
  {/if}

  <h1 class="text-3xl font-bold mb-6">Users</h1>

  <!-- Search by Email Panel -->
  <div class="panel mb-6">
    <div class="panel-header">
      <h2 class="panel-title">Search by Email</h2>
      <div class="panel-subtitle">Find users by email address (OBPv4.0.0)</div>
    </div>
    <div class="panel-content">
      <form
        onsubmit={(e) => {
          e.preventDefault();
          searchByEmail();
        }}
        class="flex gap-4 items-end"
      >
        <div class="flex-1">
          <label for="email-search" class="block text-sm font-medium mb-2"
            >Email</label
          >
          <input
            type="email"
            id="email-search"
            bind:value={emailQuery}
            placeholder="Enter email address"
            class="form-input w-full"
          />
        </div>
        <button
          type="submit"
          class="btn btn-primary"
          disabled={isSearchingEmail || !emailQuery.trim()}
        >
          {isSearchingEmail ? "Searching..." : "Search"}
        </button>
      </form>

      {#if emailResults.length > 0}
        <div class="mt-6">
          <h3 class="text-lg font-semibold mb-4">
            Results ({emailResults.length})
          </h3>
          <div class="table-wrapper">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>User ID</th>
                  <th>Provider</th>
                </tr>
              </thead>
              <tbody>
                {#each emailResults as user}
                  <tr
                    class="cursor-pointer"
                    onclick={() => {
                      if (user.provider && user.username) {
                        window.location.href = `/users/${encodeURIComponent(user.provider)}/${encodeURIComponent(user.username)}`;
                      }
                    }}
                  >
                    <td>{user.username || "N/A"}</td>
                    <td>{user.email || "N/A"}</td>
                    <td class="font-mono text-sm">{user.user_id || "N/A"}</td>
                    <td>{user.provider || "N/A"}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {:else if emailQuery.trim() && !isSearchingEmail}
        <div class="mt-6 text-center text-gray-500">
          No users found with email "{emailQuery}"
        </div>
      {/if}
    </div>
  </div>

  <!-- Search by User ID Panel -->
  <div class="panel mb-6">
    <div class="panel-header">
      <h2 class="panel-title">Search by User ID</h2>
      <div class="panel-subtitle">Find user by user ID (OBPv4.0.0)</div>
    </div>
    <div class="panel-content">
      <form
        onsubmit={(e) => {
          e.preventDefault();
          searchByUserId();
        }}
        class="flex gap-4 items-end"
      >
        <div class="flex-1">
          <label for="userid-search" class="block text-sm font-medium mb-2"
            >User ID</label
          >
          <input
            type="text"
            id="userid-search"
            bind:value={userIdQuery}
            placeholder="Enter user ID"
            class="form-input w-full"
          />
        </div>
        <button
          type="submit"
          class="btn btn-primary"
          disabled={isSearchingUserId || !userIdQuery.trim()}
        >
          {isSearchingUserId ? "Searching..." : "Search"}
        </button>
      </form>

      {#if userIdResult}
        <div class="mt-6">
          <h3 class="text-lg font-semibold mb-4">Result</h3>
          <div class="table-wrapper">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>User ID</th>
                  <th>Provider</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  class="cursor-pointer"
                  onclick={() => {
                    if (userIdResult.provider && userIdResult.username) {
                      window.location.href = `/users/${encodeURIComponent(userIdResult.provider)}/${encodeURIComponent(userIdResult.username)}`;
                    }
                  }}
                >
                  <td>{userIdResult.username || "N/A"}</td>
                  <td>{userIdResult.email || "N/A"}</td>
                  <td class="font-mono text-sm"
                    >{userIdResult.user_id || "N/A"}</td
                  >
                  <td>{userIdResult.provider || "N/A"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      {:else if userIdQuery.trim() && !isSearchingUserId}
        <div class="mt-6 text-center text-gray-500">
          No user found with ID "{userIdQuery}"
        </div>
      {/if}
    </div>
  </div>

  <!-- Search by Provider and Username Panel -->
  <div class="panel mb-6">
    <div class="panel-header">
      <h2 class="panel-title">Search by Provider and Username</h2>
      <div class="panel-subtitle">
        Find user by provider and username (OBPv5.1.0)
      </div>
    </div>
    <div class="panel-content">
      <form
        onsubmit={(e) => {
          e.preventDefault();
          searchByProviderUsername();
        }}
        class="flex gap-4 items-end"
      >
        <div class="flex-1">
          <label for="provider-search" class="block text-sm font-medium mb-2"
            >Provider</label
          >
          <input
            type="text"
            id="provider-search"
            bind:value={providerQuery}
            placeholder="e.g. http://127.0.0.1:8080"
            class="form-input w-full"
          />
        </div>
        <div class="flex-1">
          <label for="username-search" class="block text-sm font-medium mb-2"
            >Username</label
          >
          <input
            type="text"
            id="username-search"
            bind:value={usernameQuery}
            placeholder="Enter username"
            class="form-input w-full"
          />
        </div>
        <button
          type="submit"
          class="btn btn-primary"
          disabled={isSearchingProviderUsername ||
            !providerQuery.trim() ||
            !usernameQuery.trim()}
        >
          {isSearchingProviderUsername ? "Searching..." : "Search"}
        </button>
      </form>

      {#if providerUsernameResult}
        <div class="mt-6">
          <h3 class="text-lg font-semibold mb-4">Result</h3>
          <div class="table-wrapper">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>User ID</th>
                  <th>Provider</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  class="cursor-pointer"
                  onclick={() => {
                    if (
                      providerUsernameResult.provider &&
                      providerUsernameResult.username
                    ) {
                      window.location.href = `/users/${encodeURIComponent(providerUsernameResult.provider)}/${encodeURIComponent(providerUsernameResult.username)}`;
                    }
                  }}
                >
                  <td>{providerUsernameResult.username || "N/A"}</td>
                  <td>{providerUsernameResult.email || "N/A"}</td>
                  <td class="font-mono text-sm">
                    {providerUsernameResult.user_id || "N/A"}
                  </td>
                  <td>{providerUsernameResult.provider || "N/A"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      {:else if providerQuery.trim() && usernameQuery.trim() && !isSearchingProviderUsername}
        <div class="mt-6 text-center text-gray-500">
          No user found with provider "{providerQuery}" and username "{usernameQuery}"
        </div>
      {/if}
    </div>
  </div>

  <!-- Users List Panel -->
  <div class="panel">
    <div class="panel-header">
      <h2 class="panel-title">All Users</h2>
      <div class="panel-subtitle">
        Complete list of users and their entitlements
      </div>
    </div>
    <div class="panel-content">
      {#if users && users.length > 0}
        <div class="table-wrapper">
          <table class="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>User ID</th>
                <th>Provider</th>
              </tr>
            </thead>
            <tbody>
              {#each users as user}
                <tr
                  class="cursor-pointer"
                  onclick={() => {
                    if (user.provider && user.username) {
                      window.location.href = `/users/${encodeURIComponent(user.provider)}/${encodeURIComponent(user.username)}`;
                    }
                  }}
                >
                  <td class="font-medium">{user.username || "N/A"}</td>
                  <td>{user.email || "N/A"}</td>
                  <td class="font-mono text-sm">{user.user_id || "N/A"}</td>
                  <td>{user.provider || "N/A"}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if hasApiAccess}
        <div class="empty-state">
          <p>No users found</p>
        </div>
      {:else}
        <div class="empty-state">
          <p>Unable to load users. Please check your API access.</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 1400px;
  }

  .panel {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  :global([data-mode="dark"]) .panel {
    background: rgb(var(--color-surface-800));
  }

  .panel-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .panel-header {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .panel-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.25rem;
  }

  :global([data-mode="dark"]) .panel-title {
    color: var(--color-surface-100);
  }

  .panel-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .panel-subtitle {
    color: var(--color-surface-400);
  }

  .panel-content {
    padding: 1.5rem;
  }

  .form-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  :global([data-mode="dark"]) .form-input {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
    color: var(--color-surface-100);
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
    border: none;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .users-table {
    width: 100%;
    border-collapse: collapse;
  }

  .users-table th {
    text-align: left;
    padding: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .users-table th {
    color: var(--color-surface-300);
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .users-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
  }

  :global([data-mode="dark"]) .users-table td {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .users-table tbody tr:hover {
    background: #f9fafb;
  }

  :global([data-mode="dark"]) .users-table tbody tr:hover {
    background: rgb(var(--color-surface-700));
  }

  .users-table tbody tr.cursor-pointer:hover {
    background: #eff6ff;
    cursor: pointer;
  }

  :global([data-mode="dark"]) .users-table tbody tr.cursor-pointer:hover {
    background: rgb(var(--color-primary-900));
  }

  .entitlement-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  :global([data-mode="dark"]) .entitlement-badge {
    background: rgb(var(--color-primary-900));
    color: rgb(var(--color-primary-200));
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  .alert {
    padding: 1rem;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }

  .alert-error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  :global([data-mode="dark"]) .alert-error {
    background: rgb(var(--color-error-900));
    color: rgb(var(--color-error-200));
    border-color: rgb(var(--color-error-800));
  }
</style>
