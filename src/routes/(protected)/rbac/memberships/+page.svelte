<script lang="ts">
  import { Users } from "@lucide/svelte";
</script>

<svelte:head>
  <title>Memberships - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="panel">
    <div class="panel-header">
      <div class="header-content">
        <div class="header-icon">
          <Users size={32} />
        </div>
        <div>
          <h1 class="panel-title">Group Memberships</h1>
          <div class="panel-subtitle">Manage user memberships in groups</div>
        </div>
      </div>
    </div>

    <div class="panel-content">
      <div class="coming-soon">
        <div class="coming-soon-icon">
          <Users size={64} />
        </div>
        <h2 class="coming-soon-title">Coming Soon</h2>
        <p class="coming-soon-description">
          The group memberships list view is currently being updated and will be
          available soon.
        </p>
        <p class="coming-soon-description">
          In the meantime, you can create new memberships using the button
          below.
        </p>
        <a href="/rbac/memberships/create" class="btn-primary">
          <Users size={16} />
          Create Membership
        </a>
      </div>
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
    align-items: center;
    gap: 1rem;
  }

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    flex-shrink: 0;
  }

  :global([data-mode="dark"]) .header-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    padding: 4rem 2rem;
  }

  .coming-soon {
    text-align: center;
    max-width: 500px;
    margin: 0 auto;
  }

  .coming-soon-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
    color: #d1d5db;
  }

  :global([data-mode="dark"]) .coming-soon-icon {
    color: var(--color-surface-600);
  }

  .coming-soon-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  :global([data-mode="dark"]) .coming-soon-title {
    color: var(--color-surface-100);
  }

  .coming-soon-description {
    font-size: 1rem;
    color: #6b7280;
    margin: 0 0 1rem 0;
    line-height: 1.6;
  }

  :global([data-mode="dark"]) .coming-soon-description {
    color: var(--color-surface-400);
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
    margin-top: 1rem;
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

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .coming-soon {
      padding: 0 1rem;
    }
  }
</style>
