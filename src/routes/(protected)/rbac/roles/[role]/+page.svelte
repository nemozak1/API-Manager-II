<script lang="ts">
  import type { PageData } from "./$types";
  import { page } from "$app/state";

  let { data } = $props<{ data: PageData }>();

  let roleName = $derived(data.roleName);
  let entitlements = $derived(data.entitlements || []);
  let users = $derived(data.users || []);
  let endpoints = $derived(data.endpoints || []);
  let hasApiAccess = $derived(data.hasApiAccess);
  let error = $derived(data.error);

  // Create a map for quick user lookup
  let userMap = $derived.by(() => {
    const map = new Map();
    users.forEach((user) => {
      map.set(user.user_id, user);
    });
    return map;
  });
</script>

<svelte:head>
  <title>{roleName} - RBAC Roles - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Breadcrumb -->
  <nav class="breadcrumb mb-6">
    <a href="/rbac/roles" class="breadcrumb-link">Roles</a>
    <span class="breadcrumb-separator">/</span>
    <span class="breadcrumb-current">{roleName}</span>
  </nav>

  <!-- Error Alert -->
  {#if error}
    <div class="alert alert-error mb-6">
      <strong>Error:</strong>
      {error}
    </div>
  {/if}

  <!-- Role Header -->
  <div class="panel mb-6">
    <div class="panel-header">
      <div class="role-header">
        <div class="role-icon-large">🛡️</div>
        <div class="role-header-info">
          <h1 class="role-title">{roleName}</h1>
          <div class="role-stats">
            <span class="stat-badge">
              <span class="stat-number">{users.length}</span>
              <span class="stat-label">Users</span>
            </span>
            <span class="stat-separator">•</span>
            <span class="stat-badge">
              <span class="stat-number">{endpoints.length}</span>
              <span class="stat-label">Endpoints</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if !hasApiAccess}
    <div class="panel">
      <div class="panel-content">
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <h4 class="empty-title">No API Access</h4>
          <p class="empty-text">
            You need API access to view role details. Please contact your
            administrator.
          </p>
        </div>
      </div>
    </div>
  {:else}
    <div class="grid-layout">
      <!-- Users Panel -->
      <div class="panel">
        <div class="panel-header">
          <div class="section-header">
            <h2 class="section-title">
              <span class="section-icon">👥</span>
              Users with this Role
            </h2>
            <span class="section-count">{users.length}</span>
          </div>
        </div>
        <div class="panel-content">
          {#if users.length === 0}
            <div class="empty-state-small">
              <p class="empty-text">No users have been assigned this role.</p>
            </div>
          {:else}
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Display Name</th>
                    <th>Provider</th>
                  </tr>
                </thead>
                <tbody>
                  {#each users as user}
                    <tr>
                      <td class="username-cell">
                        <span class="user-icon">👤</span>
                        {user.username}
                      </td>
                      <td class="email-cell">{user.email || "N/A"}</td>
                      <td>{user.display_name || "N/A"}</td>
                      <td>
                        <span class="provider-badge">{user.provider}</span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      </div>

      <!-- Endpoints Panel -->
      <div class="panel">
        <div class="panel-header">
          <div class="section-header">
            <h2 class="section-title">
              <span class="section-icon">🔗</span>
              Enabled Endpoints
            </h2>
            <span class="section-count">{endpoints.length}</span>
          </div>
        </div>
        <div class="panel-content">
          {#if endpoints.length === 0}
            <div class="empty-state-small">
              <p class="empty-text">No endpoints are enabled by this role.</p>
            </div>
          {:else}
            <div class="endpoints-list">
              {#each endpoints as endpoint}
                <div class="endpoint-card">
                  <div class="endpoint-header">
                    <span
                      class="http-method method-{endpoint.request_verb.toLowerCase()}"
                    >
                      {endpoint.request_verb}
                    </span>
                    <code class="endpoint-url">{endpoint.request_url}</code>
                  </div>
                  <div class="endpoint-body">
                    <h4 class="endpoint-title">{endpoint.summary}</h4>
                    {#if endpoint.operation_id}
                      <div class="endpoint-meta">
                        <span class="meta-label">Operation ID:</span>
                        <code class="operation-id">{endpoint.operation_id}</code
                        >
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1600px;
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
    transition: color 0.2s;
  }

  .breadcrumb-link:hover {
    color: #2563eb;
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
    font-weight: 500;
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
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .panel-header {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .panel-content {
    padding: 1.5rem;
  }

  .role-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .role-icon-large {
    font-size: 4rem;
    flex-shrink: 0;
  }

  .role-header-info {
    flex: 1;
  }

  .role-title {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.75rem 0;
  }

  :global([data-mode="dark"]) .role-title {
    color: var(--color-surface-100);
  }

  .role-stats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .stat-badge {
    display: inline-flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .stat-number {
    font-size: 1.25rem;
    font-weight: 700;
    color: #3b82f6;
  }

  :global([data-mode="dark"]) .stat-number {
    color: rgb(var(--color-primary-400));
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .stat-label {
    color: var(--color-surface-400);
  }

  .stat-separator {
    color: #d1d5db;
  }

  :global([data-mode="dark"]) .stat-separator {
    color: var(--color-surface-600);
  }

  .alert {
    padding: 1rem;
    border-radius: 0.375rem;
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

  .grid-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  :global([data-mode="dark"]) .section-title {
    color: var(--color-surface-100);
  }

  .section-icon {
    font-size: 1.5rem;
  }

  .section-count {
    background: #f3f4f6;
    color: #6b7280;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  :global([data-mode="dark"]) .section-count {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-400);
  }

  .empty-state,
  .empty-state-small {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  .empty-state-small {
    padding: 2rem;
  }

  :global([data-mode="dark"]) .empty-state,
  :global([data-mode="dark"]) .empty-state-small {
    color: var(--color-surface-400);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-title {
    color: #4a5568;
    margin-bottom: 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
  }

  :global([data-mode="dark"]) .empty-title {
    color: var(--color-surface-300);
  }

  .empty-text {
    color: #6b7280;
  }

  :global([data-mode="dark"]) .empty-text {
    color: var(--color-surface-400);
  }

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  :global([data-mode="dark"]) .table-wrapper {
    border-color: rgb(var(--color-surface-700));
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th {
    text-align: left;
    padding: 0.75rem 1rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .data-table th {
    color: var(--color-surface-300);
    background: rgb(var(--color-surface-700));
    border-bottom-color: rgb(var(--color-surface-600));
  }

  .data-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
    color: #111827;
  }

  :global([data-mode="dark"]) .data-table td {
    border-bottom-color: rgb(var(--color-surface-700));
    color: var(--color-surface-100);
  }

  .data-table tbody tr:hover {
    background: #f9fafb;
  }

  :global([data-mode="dark"]) .data-table tbody tr:hover {
    background: rgb(var(--color-surface-700));
  }

  .data-table tbody tr:last-child td {
    border-bottom: none;
  }

  .username-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }

  .user-icon {
    font-size: 1.125rem;
  }

  .email-cell {
    color: #6b7280;
    font-family: monospace;
    font-size: 0.8125rem;
  }

  :global([data-mode="dark"]) .email-cell {
    color: var(--color-surface-400);
  }

  .provider-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  :global([data-mode="dark"]) .provider-badge {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(147, 197, 253);
  }

  .endpoints-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .endpoint-card {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
    transition: all 0.2s;
  }

  .endpoint-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  :global([data-mode="dark"]) .endpoint-card {
    border-color: rgb(var(--color-surface-700));
  }

  :global([data-mode="dark"]) .endpoint-card:hover {
    border-color: rgb(var(--color-surface-600));
  }

  .endpoint-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .endpoint-header {
    background: rgb(var(--color-surface-700));
    border-bottom-color: rgb(var(--color-surface-600));
  }

  .http-method {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  .method-get {
    background: #d1fae5;
    color: #065f46;
  }

  .method-post {
    background: #dbeafe;
    color: #1e40af;
  }

  .method-put {
    background: #fef3c7;
    color: #92400e;
  }

  .method-delete {
    background: #fee2e2;
    color: #991b1b;
  }

  .method-patch {
    background: #e0e7ff;
    color: #3730a3;
  }

  :global([data-mode="dark"]) .method-get {
    background: rgba(16, 185, 129, 0.2);
    color: rgb(110, 231, 183);
  }

  :global([data-mode="dark"]) .method-post {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(147, 197, 253);
  }

  :global([data-mode="dark"]) .method-put {
    background: rgba(251, 191, 36, 0.2);
    color: rgb(253, 224, 71);
  }

  :global([data-mode="dark"]) .method-delete {
    background: rgba(239, 68, 68, 0.2);
    color: rgb(252, 165, 165);
  }

  :global([data-mode="dark"]) .method-patch {
    background: rgba(99, 102, 241, 0.2);
    color: rgb(165, 180, 252);
  }

  .endpoint-url {
    font-family: monospace;
    font-size: 0.8125rem;
    color: #111827;
    background: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid #e5e7eb;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global([data-mode="dark"]) .endpoint-url {
    color: var(--color-surface-100);
    background: rgb(var(--color-surface-800));
    border-color: rgb(var(--color-surface-600));
  }

  .endpoint-body {
    padding: 1rem;
  }

  .endpoint-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  :global([data-mode="dark"]) .endpoint-title {
    color: var(--color-surface-100);
  }

  .endpoint-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .meta-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
  }

  :global([data-mode="dark"]) .meta-label {
    color: var(--color-surface-400);
  }

  .operation-id {
    font-family: monospace;
    font-size: 0.75rem;
    color: #3b82f6;
    background: #eff6ff;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
  }

  :global([data-mode="dark"]) .operation-id {
    color: rgb(var(--color-primary-400));
    background: rgba(59, 130, 246, 0.1);
  }

  .endpoint-description {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
    margin: 0;
  }

  :global([data-mode="dark"]) .endpoint-description {
    color: var(--color-surface-400);
  }

  .endpoint-description :global(h1),
  .endpoint-description :global(h2),
  .endpoint-description :global(h3),
  .endpoint-description :global(h4) {
    font-weight: 600;
    margin-top: 0.75rem;
    margin-bottom: 0.5rem;
    color: #111827;
  }

  :global([data-mode="dark"]) .endpoint-description :global(h1),
  :global([data-mode="dark"]) .endpoint-description :global(h2),
  :global([data-mode="dark"]) .endpoint-description :global(h3),
  :global([data-mode="dark"]) .endpoint-description :global(h4) {
    color: var(--color-surface-100);
  }

  .endpoint-description :global(code) {
    background: #f3f4f6;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.8125rem;
    font-family: monospace;
  }

  :global([data-mode="dark"]) .endpoint-description :global(code) {
    background: rgb(var(--color-surface-700));
  }

  .endpoint-description :global(pre) {
    background: #f9fafb;
    padding: 0.75rem;
    border-radius: 0.375rem;
    overflow-x: auto;
    margin: 0.5rem 0;
  }

  :global([data-mode="dark"]) .endpoint-description :global(pre) {
    background: rgb(var(--color-surface-700));
  }

  .endpoint-description :global(ul),
  .endpoint-description :global(ol) {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  .endpoint-description :global(li) {
    margin: 0.25rem 0;
  }

  .endpoint-description :global(a) {
    color: #3b82f6;
    text-decoration: underline;
  }

  :global([data-mode="dark"]) .endpoint-description :global(a) {
    color: rgb(var(--color-primary-400));
  }

  @media (max-width: 768px) {
    .role-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .role-stats {
      flex-wrap: wrap;
    }

    .endpoint-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .endpoint-url {
      width: 100%;
    }
  }
</style>
