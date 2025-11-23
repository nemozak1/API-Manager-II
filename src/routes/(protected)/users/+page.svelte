<script lang="ts">
  import type { PageData } from "./$types";

  let { data } = $props<{ data: PageData }>();

  let users = $derived(data.users || []);
  let hasApiAccess = $derived(data.hasApiAccess);
  let error = $derived(data.error);

  let searchQuery = $state("");
  let searchResults = $state<any[]>([]);
  let isSearching = $state(false);

  async function handleSearch() {
    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }

    isSearching = true;
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
      );
      const result = await response.json();
      if (result.users) {
        searchResults = result.users;
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      isSearching = false;
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

  <!-- Search Panel -->
  <div class="panel mb-6">
    <div class="panel-header">
      <h2 class="panel-title">Search Users</h2>
      <div class="panel-subtitle">
        Search for users by username, email, or user ID
      </div>
    </div>
    <div class="panel-content">
      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        class="flex gap-4 items-end"
      >
        <div class="flex-1">
          <label for="search" class="block text-sm font-medium mb-2"
            >Search Query</label
          >
          <input
            type="text"
            id="search"
            bind:value={searchQuery}
            placeholder="Enter username, email, or user ID"
            class="form-input w-full"
          />
        </div>
        <button
          type="submit"
          class="btn btn-primary"
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      {#if searchResults.length > 0}
        <div class="mt-6">
          <h3 class="text-lg font-semibold mb-4">
            Search Results ({searchResults.length})
          </h3>
          <div class="table-wrapper">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>User ID</th>
                  <th>Provider</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {#each searchResults as user}
                  <tr
                    class="cursor-pointer"
                    onclick={() => {
                      if (user.provider && user.username) {
                        window.location.href = `/users/${user.provider}/${user.username}`;
                      }
                    }}
                  >
                    <td>{user.username || "N/A"}</td>
                    <td>{user.email || "N/A"}</td>
                    <td class="font-mono text-sm">{user.user_id || "N/A"}</td>
                    <td>{user.provider || "N/A"}</td>
                    <td>{formatDate(user.created_date)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {:else if searchQuery.trim() && !isSearching}
        <div class="mt-6 text-center text-gray-500">
          No users found matching "{searchQuery}"
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
                <th>Entitlements</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {#each users as user}
                <tr
                  class="cursor-pointer"
                  onclick={() => {
                    if (user.provider && user.username) {
                      window.location.href = `/users/${user.provider}/${user.username}`;
                    }
                  }}
                >
                  <td class="font-medium">{user.username || "N/A"}</td>
                  <td>{user.email || "N/A"}</td>
                  <td class="font-mono text-sm">{user.user_id || "N/A"}</td>
                  <td>{user.provider || "N/A"}</td>
                  <td>
                    {#if user.entitlements?.list && user.entitlements.list.length > 0}
                      <div class="flex flex-wrap gap-1">
                        {#each user.entitlements.list as entitlement}
                          <span class="entitlement-badge"
                            >{entitlement.role_name || entitlement}</span
                          >
                        {/each}
                      </div>
                    {:else}
                      <span class="text-gray-500">No entitlements</span>
                    {/if}
                  </td>
                  <td>{formatDate(user.created_date)}</td>
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
