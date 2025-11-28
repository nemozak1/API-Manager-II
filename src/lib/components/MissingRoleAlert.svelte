<script lang="ts">
  import { ShieldCheck } from "@lucide/svelte";
  import MessageBox from "$lib/components/MessageBox.svelte";
  import { rolesCache } from "$lib/stores/rolesCache.svelte";
  import { onMount } from "svelte";

  interface Props {
    roles: string[];
    errorCode?: string;
    message?: string;
    bankId?: string;
  }

  let { roles, errorCode, message, bankId }: Props = $props();

  let isSubmitting = $state(false);
  let submitSuccess = $state(false);
  let submitError = $state<string | null>(null);
  let rolesMetadata = $state<Map<string, boolean>>(new Map());
  let loadingMetadata = $state(false);

  // Fetch role metadata on mount
  onMount(async () => {
    loadingMetadata = true;
    try {
      await rolesCache.fetchRoles();
      // Build a map of role name -> requires_bank_id
      const metadataMap = new Map<string, boolean>();
      roles.forEach((roleName) => {
        metadataMap.set(roleName, rolesCache.requiresBankId(roleName));
      });
      rolesMetadata = metadataMap;
    } catch (error) {
      console.error("Failed to fetch role metadata:", error);
    } finally {
      loadingMetadata = false;
    }
  });

  // Check if any role requires bank_id
  let requiresBankId = $derived(
    Array.from(rolesMetadata.values()).some((requires) => requires),
  );

  async function handleRequestClick() {
    if (isSubmitting) return;

    isSubmitting = true;
    submitError = null;

    try {
      // Submit entitlement request for each missing role
      for (const role of roles) {
        const requestBody: any = {
          role_name: role,
          // Always send bank_id - use empty string for system-wide roles
          bank_id: bankId || "",
        };

        const response = await fetch("/api/rbac/entitlement-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to submit entitlement request",
          );
        }
      }

      submitSuccess = true;

      // Redirect after a short delay to show success message
      setTimeout(() => {
        window.location.href = "/rbac/entitlement-requests";
      }, 1500);
    } catch (error) {
      submitError =
        error instanceof Error ? error.message : "Failed to submit request";
      isSubmitting = false;
    }
  }
</script>

<div class="alert alert-missing-role">
  <div class="alert-header">
    <span class="alert-icon">🔒</span>
    <strong>Missing Entitlement{roles.length > 1 ? "s" : ""}</strong>
    {#if errorCode}
      <span class="error-code">OBP-{errorCode}</span>
    {/if}
  </div>

  <div class="entitlement-list">
    {#each roles as role}
      <div class="entitlement-name">{role}</div>
    {/each}
  </div>

  {#if bankId}
    <p class="bank-info">
      <strong>Bank ID:</strong> <code class="bank-code">{bankId}</code>
    </p>
  {/if}

  {#if message}
    <MessageBox {message} type="error" />
  {/if}

  {#if submitError}
    <MessageBox message={submitError} type="error" />
  {/if}

  {#if submitSuccess}
    <div class="submit-success">
      ✅ Entitlement request{roles.length > 1 ? "s" : ""} submitted successfully!
      Redirecting...
    </div>
  {:else}
    <div class="alert-actions">
      <button
        class="btn-request"
        onclick={handleRequestClick}
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <span class="spinner">⏳</span>
          Submitting...
        {:else}
          <ShieldCheck size={18} />
          Request Entitlement
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .alert {
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .alert-missing-role {
    background: #fef3c7;
    border: 2px solid #f59e0b;
    color: #92400e;
    padding: 1.5rem;
  }

  :global([data-mode="dark"]) .alert-missing-role {
    background: rgb(var(--color-warning-900));
    border-color: rgb(var(--color-warning-600));
    color: rgb(var(--color-warning-200));
  }

  .alert-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-size: 1.125rem;
  }

  .alert-icon {
    font-size: 1.5rem;
  }

  .error-code {
    font-size: 0.75rem;
    font-family: monospace;
    background: rgba(0, 0, 0, 0.1);
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    margin-left: auto;
  }

  :global([data-mode="dark"]) .error-code {
    background: rgba(255, 255, 255, 0.1);
  }

  .entitlement-list {
    margin: 1rem 0;
  }

  .entitlement-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: #78350f;
    margin: 0.5rem 0;
  }

  :global([data-mode="dark"]) .entitlement-name {
    color: rgb(var(--color-warning-100));
  }

  .bank-info {
    margin: 1rem 0 0.5rem 0;
    padding: 0.75rem;
    background: rgba(59, 130, 246, 0.1);
    border-left: 3px solid #3b82f6;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  :global([data-mode="dark"]) .bank-info {
    background: rgba(59, 130, 246, 0.15);
    border-left-color: rgb(var(--color-primary-500));
  }

  .bank-code {
    background: rgba(0, 0, 0, 0.1);
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.875rem;
    font-weight: 600;
  }

  :global([data-mode="dark"]) .bank-code {
    background: rgba(255, 255, 255, 0.15);
  }

  .alert-actions {
    margin-top: 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    padding-top: 1rem;
  }

  :global([data-mode="dark"]) .alert-actions {
    border-top-color: rgba(255, 255, 255, 0.1);
  }

  .btn-request {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: #51b265;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .btn-request:hover {
    background: #3d9e52;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  .btn-request:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  :global([data-mode="dark"]) .btn-request {
    background: #51b265;
  }

  :global([data-mode="dark"]) .btn-request:hover {
    background: #3d9e52;
  }

  .btn-request:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
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

  .submit-success {
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 4px;
    color: #065f46;
    font-size: 0.875rem;
    font-weight: 600;
  }

  :global([data-mode="dark"]) .submit-success {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.4);
    color: rgb(var(--color-success-200));
  }
</style>
