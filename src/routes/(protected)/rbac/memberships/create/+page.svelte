<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { Users, ArrowLeft, UserCircle } from "@lucide/svelte";
  import { toast } from "$lib/utils/toastService";
  import { trackedFetch } from "$lib/utils/trackedFetch";
  import PageRoleCheck from "$lib/components/PageRoleCheck.svelte";
  import UserSearchWidget from "$lib/components/UserSearchWidget.svelte";

  let { data } = $props<{ data: PageData }>();

  let userEntitlements = $derived(data.userEntitlements || []);
  let requiredRoles = $derived(data.requiredRoles || []);
  let groups = $derived(data.groups || []);
  let hasApiAccess = $derived(data.hasApiAccess);
  let error = $derived(data.error);

  // Form state
  let selectedUserId = $state("");
  let selectedUsername = $state("");
  let selectedGroupId = $state("");
  let isSubmitting = $state(false);

  // Group search
  let groupSearchQuery = $state("");

  function handleUserSelect(user: any) {
    selectedUserId = user.user_id;
    selectedUsername = user.username;
  }

  let filteredGroups = $derived.by(() => {
    if (!groupSearchQuery.trim()) {
      return groups;
    }
    const query = groupSearchQuery.toLowerCase();
    return groups.filter(
      (group: any) =>
        group.group_name.toLowerCase().includes(query) ||
        group.group_id.toLowerCase().includes(query) ||
        group.bank_id.toLowerCase().includes(query),
    );
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!selectedUserId.trim()) {
      toast.error("Validation Error", "User is required");
      return;
    }

    if (!selectedGroupId.trim()) {
      toast.error("Validation Error", "Group is required");
      return;
    }

    isSubmitting = true;

    try {
      const response = await trackedFetch("/api/rbac/memberships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedUserId.trim(),
          group_id: selectedGroupId.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create membership");
      }

      toast.success("Membership Created", `User successfully added to group`);

      // Redirect to memberships list after short delay
      setTimeout(() => {
        goto("/rbac/memberships");
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create membership";
      toast.error("Error", errorMessage);
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto("/rbac/memberships");
  }
</script>

<svelte:head>
  <title>Create Membership - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Role Check -->
  <PageRoleCheck {userEntitlements} {requiredRoles} />

  <!-- Breadcrumb Navigation -->
  <nav class="breadcrumb mb-6">
    <a href="/rbac/memberships" class="breadcrumb-link">Memberships</a>
    <span class="breadcrumb-separator">›</span>
    <span class="breadcrumb-current">Create Membership</span>
  </nav>

  <div class="panel">
    <div class="panel-header">
      <div class="header-content">
        <div class="header-icon">
          <Users size={32} />
        </div>
        <div>
          <h1 class="panel-title">Create Group Membership</h1>
          <div class="panel-subtitle">
            Add a user to a group to grant them group-based access
          </div>
        </div>
      </div>
    </div>

    <div class="panel-content">
      {#if error && !hasApiAccess}
        <div class="error-message">
          <p>⚠️ {error}</p>
        </div>
      {/if}

      <form onsubmit={handleSubmit} class="form">
        <!-- User Selection -->
        <div class="form-group">
          <label for="user" class="form-label">
            <UserCircle size={16} />
            User
            <span class="required">*</span>
          </label>
          <UserSearchWidget
            onSelect={handleUserSelect}
            bind:selectedUserId
            bind:selectedUsername
            disabled={isSubmitting}
          />
          <div class="form-help">Select the user to add to a group</div>
        </div>

        <!-- Group Selection -->
        <div class="form-group">
          <label for="group" class="form-label">
            <Users size={16} />
            Group
            <span class="required">*</span>
          </label>
          <div class="form-help">Select the group to add the user to</div>

          {#if hasApiAccess && groups.length > 0}
            <!-- Group Search -->
            <div class="search-wrapper">
              <input
                type="text"
                class="search-input"
                placeholder="Search groups by name, ID, or bank..."
                bind:value={groupSearchQuery}
                disabled={isSubmitting}
              />
            </div>

            <!-- Groups List -->
            {#if filteredGroups.length === 0}
              <div class="empty-state-small">
                <p>No groups found matching "{groupSearchQuery}"</p>
              </div>
            {:else}
              <div class="groups-selector">
                {#each filteredGroups as group}
                  <label class="group-option">
                    <input
                      type="radio"
                      name="group"
                      value={group.group_id}
                      bind:group={selectedGroupId}
                      disabled={isSubmitting || !group.is_enabled}
                    />
                    <div class="group-option-content">
                      <div class="group-option-header">
                        <span class="group-option-name">{group.group_name}</span
                        >
                        {#if !group.is_enabled}
                          <span class="group-disabled-badge">Disabled</span>
                        {/if}
                      </div>
                      <span class="group-option-description"
                        >{group.group_description}</span
                      >
                      <div class="group-option-meta">
                        <span class="group-meta-item">
                          Bank: {group.bank_id}
                        </span>
                        {#if group.list_of_roles && group.list_of_roles.length > 0}
                          <span class="group-meta-item">
                            {group.list_of_roles.length} role{group
                              .list_of_roles.length !== 1
                              ? "s"
                              : ""}
                          </span>
                        {/if}
                      </div>
                    </div>
                  </label>
                {/each}
              </div>
            {/if}
          {:else if !hasApiAccess}
            <div class="empty-state-small">
              <p>No API access available</p>
            </div>
          {:else}
            <div class="empty-state-small">
              <p>No groups available</p>
            </div>
          {/if}
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <button
            type="button"
            class="btn-secondary"
            onclick={handleCancel}
            disabled={isSubmitting}
          >
            <ArrowLeft size={16} />
            Cancel
          </button>
          <button type="submit" class="btn-primary" disabled={isSubmitting}>
            {#if isSubmitting}
              ⏳ Creating...
            {:else}
              <Users size={16} />
              Create Membership
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 900px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .breadcrumb-link {
    color: #3b82f6;
    text-decoration: none;
  }

  .breadcrumb-link:hover {
    text-decoration: underline;
  }

  :global([data-mode="dark"]) .breadcrumb-link {
    color: rgb(var(--color-primary-400));
  }

  .breadcrumb-separator {
    color: #9ca3af;
  }

  :global([data-mode="dark"]) .breadcrumb-separator {
    color: var(--color-surface-500);
  }

  .breadcrumb-current {
    color: #6b7280;
  }

  :global([data-mode="dark"]) .breadcrumb-current {
    color: var(--color-surface-400);
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
    padding: 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .panel-header {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    background: #eff6ff;
    color: #3b82f6;
    border-radius: 12px;
    flex-shrink: 0;
  }

  :global([data-mode="dark"]) .header-icon {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(var(--color-primary-400));
  }

  .panel-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  :global([data-mode="dark"]) .panel-title {
    color: var(--color-surface-100);
  }

  .panel-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  :global([data-mode="dark"]) .panel-subtitle {
    color: var(--color-surface-400);
  }

  .panel-content {
    padding: 2rem;
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

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  :global([data-mode="dark"]) .form-label {
    color: var(--color-surface-200);
  }

  .required {
    color: #dc2626;
  }

  .form-help {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  :global([data-mode="dark"]) .form-help {
    color: var(--color-surface-400);
  }

  .search-wrapper {
    margin-bottom: 1rem;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem;
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

  .search-input:disabled {
    background: #f9fafb;
    cursor: not-allowed;
    opacity: 0.6;
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

  :global([data-mode="dark"]) .search-input:disabled {
    background: rgb(var(--color-surface-800));
  }

  .groups-selector {
    max-height: 500px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  :global([data-mode="dark"]) .groups-selector {
    border-color: rgb(var(--color-surface-700));
  }

  .group-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .group-option:has(input:checked) {
    background: #ede9fe;
    border-color: #667eea;
  }

  .group-option:has(input:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .group-option:not(:has(input:disabled)):hover {
    background: #f9fafb;
  }

  :global([data-mode="dark"]) .group-option {
    border-color: rgb(var(--color-surface-700));
  }

  :global([data-mode="dark"]) .group-option:has(input:checked) {
    background: rgba(102, 126, 234, 0.15);
    border-color: rgb(var(--color-primary-500));
  }

  :global([data-mode="dark"]) .group-option:not(:has(input:disabled)):hover {
    background: rgb(var(--color-surface-700));
  }

  .group-option input[type="radio"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
    margin-top: 0.25rem;
    flex-shrink: 0;
  }

  .group-option-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .group-option-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: space-between;
  }

  .group-option-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
  }

  :global([data-mode="dark"]) .group-option-name {
    color: var(--color-surface-100);
  }

  .group-disabled-badge {
    font-size: 0.65rem;
    padding: 0.125rem 0.375rem;
    background: #fee2e2;
    color: #991b1b;
    border-radius: 4px;
    font-weight: 600;
  }

  :global([data-mode="dark"]) .group-disabled-badge {
    background: rgba(239, 68, 68, 0.2);
    color: rgb(var(--color-error-300));
  }

  .group-option-description {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
  }

  :global([data-mode="dark"]) .group-option-description {
    color: var(--color-surface-400);
  }

  .group-option-meta {
    display: flex;
    gap: 1rem;
    margin-top: 0.25rem;
  }

  .group-meta-item {
    font-size: 0.65rem;
    color: #9ca3af;
    font-weight: 500;
  }

  :global([data-mode="dark"]) .group-meta-item {
    color: var(--color-surface-500);
  }

  .empty-state-small {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
    background: #fafafa;
    border: 1px dashed #d1d5db;
    border-radius: 6px;
    color: #9ca3af;
    text-align: center;
  }

  :global([data-mode="dark"]) .empty-state-small {
    background: rgb(var(--color-surface-900));
    border-color: rgb(var(--color-surface-700));
    color: var(--color-surface-500);
  }

  .empty-state-small p {
    margin: 0;
    font-size: 0.875rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .form-actions {
    border-top-color: rgb(var(--color-surface-700));
  }

  .btn-primary,
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :global([data-mode="dark"]) .btn-primary {
    background: rgb(var(--color-primary-600));
  }

  :global([data-mode="dark"]) .btn-primary:hover:not(:disabled) {
    background: rgb(var(--color-primary-700));
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :global([data-mode="dark"]) .btn-secondary {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-200);
  }

  :global([data-mode="dark"]) .btn-secondary:hover:not(:disabled) {
    background: rgb(var(--color-surface-600));
  }

  @media (max-width: 640px) {
    .form-actions {
      flex-direction: column-reverse;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
      justify-content: center;
    }

    .header-content {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
