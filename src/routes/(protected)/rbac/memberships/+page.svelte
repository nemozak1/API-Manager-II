<script lang="ts">
  import type { PageData } from "./$types";
  import {
    Users,
    Building2,
    Shield,
    Plus,
    Search,
    Trash2,
    UserCircle,
  } from "@lucide/svelte";
  import { toast } from "$lib/utils/toastService";
  import { trackedFetch } from "$lib/utils/trackedFetch";

  let { data } = $props<{ data: PageData }>();

  let memberships = $state(data.memberships || []);
  let hasApiAccess = $derived(data.hasApiAccess);
  let error = $derived(data.error);

  // Search functionality
  let searchQuery = $state("");

  let filteredMemberships = $derived.by(() => {
    if (!searchQuery.trim()) {
      return memberships;
    }
    const query = searchQuery.toLowerCase();
    return memberships.filter(
      (membership: any) =>
        membership.username.toLowerCase().includes(query) ||
        membership.user_id.toLowerCase().includes(query) ||
        membership.group_id.toLowerCase().includes(query) ||
        membership.bank_id.toLowerCase().includes(query),
    );
  });

  // Group memberships by user for better display
  let membershipsByUser = $derived.by(() => {
    const grouped = new Map<string, any[]>();
    filteredMemberships.forEach((membership: any) => {
      const key = membership.user_id;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)?.push(membership);
    });
    return grouped;
  });

  let isDeleting = $state<string | null>(null);

  async function deleteMembership(userId: string, groupId: string) {
    if (
      !confirm(
        `Are you sure you want to remove this user from the group?\n\nUser: ${userId}\nGroup: ${groupId}`,
      )
    ) {
      return;
    }

    isDeleting = `${userId}-${groupId}`;

    try {
      const response = await trackedFetch(
        `/api/rbac/memberships/${userId}/${groupId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete membership");
      }

      // Remove from local state
      memberships = memberships.filter(
        (m: any) => !(m.user_id === userId && m.group_id === groupId),
      );

      toast.success("Membership Deleted", "User removed from group successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete membership";
      toast.error("Error", errorMessage);
    } finally {
      isDeleting = null;
    }
  }
</script>

<svelte:head>
  <title>Memberships - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="panel">
    <div class="panel-header">
      <div class="header-content">
        <div>
          <h1 class="panel-title">Group Memberships</h1>
          <div class="panel-subtitle">
            Manage user memberships in groups
          </div>
        </div>
        <a href="/rbac/memberships/create" class="btn-primary">
          <Plus size={16} />
          Create Membership
        </a>
      </div>
    </div>

    <div class="panel-content">
      {#if error && !hasApiAccess}
        <div class="error-message">
          <p>⚠️ {error}</p>
        </div>
      {:else if memberships.length === 0}
        <div class="empty-state">
          <div class="empty-icon">
            <Users size={48} />
          </div>
          <h4 class="empty-title">No memberships yet</h4>
          <p class="empty-description">
            Create your first group membership to assign users to groups
          </p>
          <a href="/rbac/memberships/create" class="btn-primary">
            <Plus size={16} />
            Create Your First Membership
          </a>
        </div>
      {:else}
        <!-- Search Bar -->
        <div class="search-bar">
          <Search class="search-icon" size={18} />
          <input
            type="text"
            class="search-input"
            placeholder="Search by username, user ID, group ID, or bank..."
            bind:value={searchQuery}
          />
        </div>

        <!-- Stats -->
        <div class="stats">
          <div class="stat-item">
            <div class="stat-label">Total Memberships</div>
            <div class="stat-value">{memberships.length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Unique Users</div>
            <div class="stat-value">{membershipsByUser.size}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Showing</div>
            <div class="stat-value">{filteredMemberships.length}</div>
          </div>
        </div>

        <!-- Memberships Table -->
        {#if filteredMemberships.length === 0}
          <div class="empty-state">
            <div class="empty-icon">
              <Search size={48} />
            </div>
            <h4 class="empty-title">No memberships found</h4>
            <p class="empty-description">Try adjusting your search query</p>
          </div>
        {:else}
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>
                    <UserCircle size={16} />
                    User
                  </th>
                  <th>
                    <Users size={16} />
                    Group ID
                  </th>
                  <th>
                    <Building2 size={16} />
                    Bank ID
                  </th>
                  <th>
                    <Shield size={16} />
                    Role
                  </th>
                  <th class="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each filteredMemberships as membership}
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-icon">
                          <UserCircle size={20} />
                        </div>
                        <div>
                          <div class="user-name">{membership.username}</div>
                          <div class="user-id">{membership.user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="group-badge">{membership.group_id}</span>
                    </td>
                    <td>
                      <span class="bank-badge">{membership.bank_id}</span>
                    </td>
                    <td>
                      <span class="role-badge">{membership.role_name}</span>
                    </td>
                    <td class="actions-cell">
                      <button
                        class="btn-delete"
                        onclick={() =>
                          deleteMembership(
                            membership.user_id,
                            membership.group_id,
                          )}
                        disabled={isDeleting ===
                          `${membership.user_id}-${membership.group_id}`}
                        title="Remove from group"
                      >
                        {#if isDeleting === `${membership.user_id}-${membership.group_id}`}
                          ⏳
                        {:else}
                          <Trash2 size={16} />
                        {/if}
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
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

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .panel-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  :global([data-mode="dark"]) .panel-title {
    color: var(--color-surface-100);
  }

  .panel-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }

  :global([data-mode="dark"]) .panel-subtitle {
    color: var(--color-surface-400);
  }

  .panel-content {
    padding: 2rem;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    white-space: nowrap;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  :global([data-mode="dark"]) .btn-primary {
    background: rgb(var(--color-primary-600));
  }

  :global([data-mode="dark"]) .btn-primary:hover {
    background: rgb(var(--color-primary-700));
  }

  .error-message {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #991b1b;
    font-size: 0.875rem;
  }

  :global([data-mode="dark"]) .error-message {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: rgb(var(--color-error-200));
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .empty-state {
    color: var(--color-surface-400);
  }

  .empty-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
    color: #d1d5db;
  }

  :global([data-mode="dark"]) .empty-icon {
    color: var(--color-surface-600);
  }

  .empty-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #4a5568;
    margin: 0 0 0.5rem 0;
  }

  :global([data-mode="dark"]) .empty-title {
    color: var(--color-surface-300);
  }

  .empty-description {
    margin: 0 0 1.5rem 0;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .empty-description {
    color: var(--color-surface-400);
  }

  .search-bar {
    position: relative;
    margin-bottom: 1.5rem;
  }

  .search-bar :global(.search-icon) {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    pointer-events: none;
  }

  :global([data-mode="dark"]) .search-bar :global(.search-icon) {
    color: var(--color-surface-400);
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 3rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  :global([data-mode="dark"]) .search-input {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
    color: var(--color-surface-100);
  }

  :global([data-mode="dark"]) .search-input:focus {
    border-color: rgb(var(--color-primary-500));
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-item {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .stat-item {
    background: rgb(var(--color-surface-900));
    border-color: rgb(var(--color-surface-700));
  }

  .stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  :global([data-mode="dark"]) .stat-label {
    color: var(--color-surface-400);
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
  }

  :global([data-mode="dark"]) .stat-value {
    color: var(--color-surface-100);
  }

  .table-container {
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
  }

  :global([data-mode="dark"]) .table-container {
    border-color: rgb(var(--color-surface-700));
  }

  .table {
    width: 100%;
    border-collapse: collapse;
  }

  .table thead {
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .table thead {
    background: rgb(var(--color-surface-900));
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .table th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .table th:first-child {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  :global([data-mode="dark"]) .table th {
    color: var(--color-surface-400);
  }

  .table tbody tr {
    border-bottom: 1px solid #e5e7eb;
    transition: background 0.2s;
  }

  .table tbody tr:hover {
    background: #f9fafb;
  }

  :global([data-mode="dark"]) .table tbody tr {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  :global([data-mode="dark"]) .table tbody tr:hover {
    background: rgb(var(--color-surface-900));
  }

  .table td {
    padding: 1rem;
    font-size: 0.875rem;
    color: #374151;
  }

  :global([data-mode="dark"]) .table td {
    color: var(--color-surface-200);
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #eff6ff;
    color: #3b82f6;
    border-radius: 50%;
    flex-shrink: 0;
  }

  :global([data-mode="dark"]) .user-icon {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(var(--color-primary-400));
  }

  .user-name {
    font-weight: 600;
    color: #111827;
  }

  :global([data-mode="dark"]) .user-name {
    color: var(--color-surface-100);
  }

  .user-id {
    font-size: 0.75rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .user-id {
    color: var(--color-surface-400);
  }

  .group-badge,
  .bank-badge,
  .role-badge {
    display: inline-block;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .group-badge {
    background: #f0fdf4;
    color: #166534;
  }

  :global([data-mode="dark"]) .group-badge {
    background: rgba(34, 197, 94, 0.2);
    color: rgb(var(--color-success-300));
  }

  .bank-badge {
    background: #fef3c7;
    color: #92400e;
  }

  :global([data-mode="dark"]) .bank-badge {
    background: rgba(251, 191, 36, 0.2);
    color: rgb(var(--color-warning-300));
  }

  .role-badge {
    background: #ede9fe;
    color: #5b21b6;
  }

  :global([data-mode="dark"]) .role-badge {
    background: rgba(139, 92, 246, 0.2);
    color: rgb(var(--color-primary-300));
  }

  .actions-column {
    width: 100px;
    text-align: center;
  }

  .actions-cell {
    text-align: center;
  }

  .btn-delete {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background: #fef2f2;
    color: #dc2626;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-delete:hover:not(:disabled) {
    background: #fee2e2;
  }

  .btn-delete:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :global([data-mode="dark"]) .btn-delete {
    background: rgba(239, 68, 68, 0.1);
    color: rgb(var(--color-error-400));
  }

  :global([data-mode="dark"]) .btn-delete:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.2);
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .btn-primary {
      width: 100%;
      justify-content: center;
    }

    .stats {
      grid-template-columns: 1fr;
    }

    .table-container {
      overflow-x: scroll;
    }

    .table {
      min-width: 700px;
    }
  }
</style>
