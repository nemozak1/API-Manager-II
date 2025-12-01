<script lang="ts">
  import { Search, KeyRound, Globe, Building2 } from "@lucide/svelte";

  interface Role {
    role: string;
    bank_id?: string;
    entitlement_count?: number;
  }

  interface Props {
    roles: Role[];
    selectedRole?: string;
    roleScope?: "all" | "system" | "bank";
    disabled?: boolean;
  }

  let {
    roles,
    selectedRole = $bindable(""),
    roleScope = $bindable<"all" | "system" | "bank">("all"),
    disabled = false,
  }: Props = $props();

  let searchQuery = $state("");

  // Filter roles based on search query and scope
  let filteredRoles = $derived.by(() => {
    let filtered = roles;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((role) =>
        role.role.toLowerCase().includes(query),
      );
    }

    // Filter by scope
    if (roleScope === "system") {
      // System roles typically don't have bank_id or are named with "AtAllBanks" or "AtAnyBank"
      filtered = filtered.filter(
        (role) =>
          role.role.includes("AtAllBanks") ||
          role.role.includes("AtAnyBank") ||
          role.role.includes("System") ||
          !role.role.includes("AtOneBank"),
      );
    } else if (roleScope === "bank") {
      // Bank roles typically have "AtOneBank" in the name
      filtered = filtered.filter((role) => role.role.includes("AtOneBank"));
    }
    // If roleScope === "all", don't filter by scope

    return filtered;
  });
</script>

<div class="role-search-widget">
  <!-- Search and Scope Toggle Row -->
  <div class="search-and-toggle-row">
    <!-- Search Box -->
    <div class="search-wrapper">
      <Search class="search-icon" size={16} />
      <input
        type="text"
        class="search-input"
        placeholder="Search {roleScope === 'all'
          ? 'all'
          : roleScope === 'system'
            ? 'system-wide'
            : 'bank-level'} roles..."
        bind:value={searchQuery}
        {disabled}
      />
    </div>

    <!-- Scope Toggle -->
    <div class="scope-toggle">
      <button
        type="button"
        class="scope-button"
        class:active={roleScope === "all"}
        onclick={() => {
          roleScope = "all";
          selectedRole = "";
        }}
        {disabled}
      >
        All
      </button>
      <button
        type="button"
        class="scope-button"
        class:active={roleScope === "system"}
        onclick={() => {
          roleScope = "system";
          selectedRole = "";
        }}
        {disabled}
      >
        <Globe size={14} />
        System
      </button>
      <button
        type="button"
        class="scope-button"
        class:active={roleScope === "bank"}
        onclick={() => {
          roleScope = "bank";
          selectedRole = "";
        }}
        {disabled}
      >
        <Building2 size={14} />
        Bank
      </button>
    </div>
  </div>

  <!-- Role Selection -->
  <div class="role-selector">
    {#if filteredRoles.length === 0}
      <div class="empty-roles">
        <p>
          No {roleScope === "all"
            ? ""
            : roleScope === "system"
              ? "system-wide "
              : "bank-level "}roles found
          {searchQuery ? `matching "${searchQuery}"` : ""}
        </p>
      </div>
    {:else}
      <div class="roles-grid">
        {#each filteredRoles as role}
          <label class="role-option">
            <input
              type="radio"
              name="role"
              value={role.role}
              bind:group={selectedRole}
              {disabled}
            />
            <div class="role-option-content">
              <span class="role-option-name">{role.role}</span>
              {#if role.entitlement_count !== undefined}
                <span class="role-option-count">
                  {role.entitlement_count}
                  {role.entitlement_count === 1 ? "user" : "users"}
                </span>
              {/if}
            </div>
          </label>
        {/each}
      </div>
    {/if}
  </div>

  {#if selectedRole}
    <div class="selected-role">
      <KeyRound size={14} />
      <span class="selected-role-text">
        Selected: <strong>{selectedRole}</strong>
        <span class="role-scope-badge">
          {roleScope === "all"
            ? "All Roles"
            : roleScope === "system"
              ? "System-wide"
              : "Bank-level"}
        </span>
      </span>
    </div>
  {/if}
</div>

<style>
  .role-search-widget {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .search-and-toggle-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .search-wrapper {
    flex: 1;
  }

  .scope-toggle {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem;
    background: #f3f4f6;
    border-radius: 6px;
    flex-shrink: 0;
  }

  :global([data-mode="dark"]) .scope-toggle {
    background: rgb(var(--color-surface-700));
  }

  .scope-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .scope-button:hover:not(:disabled) {
    color: #374151;
    background: rgba(0, 0, 0, 0.05);
  }

  .scope-button.active {
    background: white;
    color: #667eea;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .scope-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :global([data-mode="dark"]) .scope-button {
    color: var(--color-surface-400);
  }

  :global([data-mode="dark"]) .scope-button:hover:not(:disabled) {
    color: var(--color-surface-200);
    background: rgba(255, 255, 255, 0.05);
  }

  :global([data-mode="dark"]) .scope-button.active {
    background: rgb(var(--color-surface-800));
    color: rgb(var(--color-primary-400));
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .search-wrapper :global(.search-icon) {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    pointer-events: none;
  }

  :global([data-mode="dark"]) .search-wrapper :global(.search-icon) {
    color: var(--color-surface-400);
  }

  .search-input {
    width: 100%;
    padding: 0.625rem 0.75rem 0.625rem 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  :global([data-mode="dark"]) .search-input:disabled {
    background: rgb(var(--color-surface-800));
  }

  .role-selector {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.5rem;
  }

  :global([data-mode="dark"]) .role-selector {
    border-color: rgb(var(--color-surface-700));
  }

  .roles-grid {
    display: grid;
    gap: 0.5rem;
  }

  .role-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .role-option:has(input:checked) {
    background: #ede9fe;
    border-color: #667eea;
  }

  .role-option:hover {
    background: #f9fafb;
  }

  :global([data-mode="dark"]) .role-option {
    border-color: rgb(var(--color-surface-700));
  }

  :global([data-mode="dark"]) .role-option:has(input:checked) {
    background: rgba(102, 126, 234, 0.15);
    border-color: rgb(var(--color-primary-500));
  }

  :global([data-mode="dark"]) .role-option:hover {
    background: rgb(var(--color-surface-700));
  }

  .role-option input[type="radio"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  .role-option-content {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .role-option-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
  }

  :global([data-mode="dark"]) .role-option-name {
    color: var(--color-surface-100);
  }

  .role-option-count {
    font-size: 0.75rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .role-option-count {
    color: var(--color-surface-400);
  }

  .empty-roles {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
  }

  :global([data-mode="dark"]) .empty-roles {
    color: var(--color-surface-400);
  }

  .selected-role {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #166534;
  }

  :global([data-mode="dark"]) .selected-role {
    background: rgba(34, 197, 94, 0.15);
    border-color: rgba(34, 197, 94, 0.3);
    color: rgb(var(--color-success-200));
  }

  .selected-role :global(svg) {
    flex-shrink: 0;
  }

  .selected-role-text {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .role-scope-badge {
    display: inline-flex;
    padding: 0.125rem 0.375rem;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 600;
  }

  :global([data-mode="dark"]) .role-scope-badge {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
