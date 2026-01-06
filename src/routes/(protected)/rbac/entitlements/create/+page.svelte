<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { User, KeyRound, Building2, Search } from "@lucide/svelte";
  import { toast } from "$lib/utils/toastService";
  import { trackedFetch } from "$lib/utils/trackedFetch";
  import PageRoleCheck from "$lib/components/PageRoleCheck.svelte";
  import UserSearchWidget from "$lib/components/UserSearchWidget.svelte";
  import BankSelectWidget from "$lib/components/BankSelectWidget.svelte";
  import RoleSearchWidget from "$lib/components/RoleSearchWidget.svelte";
  import type { PageData } from "./$types";
  import {
    extractErrorFromResponse,
    formatErrorForDisplay,
    logErrorDetails,
  } from "$lib/utils/errorHandler";

  let { data } = $props<{ data: PageData }>();

  let userEntitlements = $derived(data.userEntitlements || []);
  let requiredRoles = $derived(data.requiredRoles || []);
  let roles = $derived(data.roles || []);

  // Read URL parameters
  const urlUsername = $page.url.searchParams.get("username") || "";
  const urlRole = $page.url.searchParams.get("role") || "";

  // Form state
  let userId = $state("");
  let username = $state(urlUsername);
  let roleName = $state(urlRole);
  let roleScope = $state<"all" | "system" | "bank">("all");
  let bankId = $state("");
  let isSubmitting = $state(false);

  function handleUserSelect(user: any) {
    userId = user.user_id;
    username = user.username;
  }

  // Clear bankId when switching to system scope
  $effect(() => {
    console.log("roleScope changed to:", roleScope);
    if (roleScope === "system") {
      bankId = "";
    }
  });

  // Debug: log when roleName changes
  $effect(() => {
    console.log("roleName changed to:", roleName, "roleScope is:", roleScope);
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!userId.trim()) {
      toast.error("Validation Error", "User ID is required");
      return;
    }

    if (!roleName) {
      toast.error("Validation Error", "Role is required");
      return;
    }

    isSubmitting = true;

    try {
      const response = await trackedFetch("/api/rbac/entitlements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId.trim(),
          role_name: roleName,
          bank_id: bankId.trim() || "",
        }),
      });

      if (!response.ok) {
        const errorDetails = await extractErrorFromResponse(
          response,
          "Failed to create entitlement",
        );
        logErrorDetails("Create Entitlement", errorDetails);
        const errorMessage = formatErrorForDisplay(errorDetails);
        throw new Error(errorMessage);
      }

      toast.success(
        "Entitlement Created",
        `Successfully granted ${roleName} to user ${userId}`,
      );

      // Redirect to user detail page after short delay
      setTimeout(() => {
        goto(`/users/${userId.trim()}`);
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create entitlement";
      toast.error("Error", errorMessage);
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto("/rbac/entitlements");
  }
</script>

<svelte:head>
  <title>Create Entitlement - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Role Check - Display missing roles upfront -->
  <PageRoleCheck {userEntitlements} {requiredRoles} />

  <!-- Breadcrumb -->
  <nav class="breadcrumb mb-6">
    <a href="/rbac/entitlements" class="breadcrumb-link">Entitlements</a>
    <span class="breadcrumb-separator">/</span>
    <span class="breadcrumb-current">Create</span>
  </nav>

  <div class="panel">
    <div class="panel-header">
      <div class="header-content">
        <div class="header-icon">➕</div>
        <div>
          <h1 class="panel-title">Create Entitlement</h1>
          <div class="panel-subtitle">
            Grant a role to a user for system-wide or bank-specific access
          </div>
        </div>
      </div>
    </div>

    <div class="panel-content">
      <form onsubmit={handleSubmit} class="form">
        <!-- User Search Field -->
        <div class="form-group">
          <label class="form-label">
            <User size={18} />
            User
            <span class="required">*</span>
          </label>
          <UserSearchWidget
            onSelect={handleUserSelect}
            bind:selectedUserId={userId}
            bind:selectedUsername={username}
            disabled={isSubmitting}
            initialUsername={urlUsername}
          />
          <div class="form-hint">
            Search for a user by username or email to grant the entitlement to
          </div>
        </div>

        <!-- Role Selection Field -->
        <div class="form-group">
          <label class="form-label">
            <KeyRound size={18} />
            Role
            <span class="required">*</span>
          </label>
          <div class="form-hint">
            Select whether the role is system-wide or bank-level, then choose a
            role
          </div>
          <RoleSearchWidget
            {roles}
            bind:selectedRole={roleName}
            bind:roleScope
            disabled={isSubmitting}
          />
        </div>

        <!-- Bank ID Field - Only show for All or Bank scope -->
        {#if roleScope !== "system"}
          <div class="form-group">
            <label class="form-label">
              <Building2 size={18} />
              Bank ID
              <span class="optional">(Optional)</span>
            </label>
            <BankSelectWidget
              bind:selectedBankId={bankId}
              disabled={isSubmitting}
              allowEmpty={true}
              emptyLabel="System-wide (no specific bank)"
            />
            <div class="form-hint">
              Leave empty for system-wide roles, or select a specific bank for
              bank-specific roles
            </div>
          </div>
        {/if}

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="button"
            class="btn-secondary"
            onclick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" class="btn-primary" disabled={isSubmitting}>
            {#if isSubmitting}
              <span class="spinner">⏳</span>
              Creating...
            {:else}
              Create Entitlement
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 1200px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .breadcrumb-link {
    color: #667eea;
    text-decoration: none;
    transition: color 0.2s;
  }

  .breadcrumb-link:hover {
    color: #5568d3;
    text-decoration: underline;
  }

  :global([data-mode="dark"]) .breadcrumb-link {
    color: rgb(var(--color-primary-400));
  }

  .breadcrumb-separator {
    color: #9ca3af;
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
    gap: 1.5rem;
  }

  .header-icon {
    font-size: 2.5rem;
  }

  .panel-title {
    font-size: 1.875rem;
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

  .form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
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
    color: #ef4444;
  }

  .optional {
    color: #9ca3af;
    font-weight: 400;
  }

  .form-hint {
    font-size: 0.75rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .form-hint {
    color: var(--color-surface-400);
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

  .btn-secondary,
  .btn-primary {
    display: flex;
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

  .btn-secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #f9fafb;
  }

  :global([data-mode="dark"]) .btn-secondary {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-200);
    border-color: rgb(var(--color-surface-600));
  }

  :global([data-mode="dark"]) .btn-secondary:hover:not(:disabled) {
    background: rgb(var(--color-surface-600));
  }

  .btn-primary {
    background: #51b265;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #3d9e52;
  }

  :global([data-mode="dark"]) .btn-primary {
    background: #51b265;
  }

  :global([data-mode="dark"]) .btn-primary:hover:not(:disabled) {
    background: #3d9e52;
  }

  .btn-secondary:disabled,
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    display: inline-block;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .panel-header {
      padding: 1.5rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .panel-content {
      padding: 1.5rem;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .btn-secondary,
    .btn-primary {
      width: 100%;
      justify-content: center;
    }
  }
</style>
