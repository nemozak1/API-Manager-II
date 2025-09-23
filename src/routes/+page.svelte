<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  import AuthNotification from "$lib/components/AuthNotification.svelte";

  // Check if user is logged in (this will be set by the layout)
  export let data: any = {};
  $: user = data?.user;
  $: authInfo = data?.authInfo;
</script>

<div class="container mx-auto px-4 py-8">
  <header class="text-center mb-8">
    {#if user}
      <AuthNotification
        type="success"
        title="Welcome"
        message="You are successfully authenticated and ready to use the API Manager."
        autoClose={true}
        duration={4000}
      />
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
    <!-- API Metrics Panel -->
    <div class="modules-grid">
      <div
        class="module-card available"
        on:click={() => goto("/metrics")}
        on:keydown={(e) => e.key === "Enter" && goto("/metrics")}
        role="button"
        tabindex="0"
      >
        <div class="module-header">
          <div class="module-icon">📈</div>
          <div class="module-status-badge status-available">Available</div>
        </div>

        <div class="module-content">
          <h3 class="module-title">API Metrics</h3>
          <p class="module-description">
            Detailed metrics and analytics for API usage and performance
          </p>

          <div class="module-features">
            <span class="feature-tag">Usage Metrics</span>
            <span class="feature-tag">Performance Analytics</span>
            <span class="feature-tag">Request Tracking</span>
            <span class="feature-tag">Historical Data</span>
          </div>
        </div>

        <div class="module-footer">
          <div class="module-path">/metrics</div>
          <div class="module-action">Click to access →</div>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  .container {
    max-width: 1200px;
  }

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .module-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .module-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;
  }

  .module-card.available {
    border-left: 4px solid #10b981;
  }

  .module-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .module-icon {
    font-size: 2rem;
    line-height: 1;
  }

  .module-status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-available {
    background-color: #d1fae5;
    color: #065f46;
  }

  .module-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .module-description {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1rem;
  }

  .module-features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .feature-tag {
    background-color: #f3f4f6;
    color: #374151;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .module-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
  }

  .module-path {
    font-family: monospace;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .module-action {
    font-size: 0.75rem;
    font-weight: 500;
    color: #3b82f6;
  }

  @media (max-width: 768px) {
    .container {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .modules-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
