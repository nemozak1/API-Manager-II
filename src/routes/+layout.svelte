<script lang="ts">
  import "../app.css";
  import Navigation from "$lib/components/Navigation.svelte";

  // Get data from layout server
  export let data: any = {};
  $: user = data?.user;
  $: authInfo = data?.authInfo;
  $: hasApiAccess = authInfo?.source === "obp_api";
</script>

<svelte:head>
  <!-- Favicon configuration -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/favicon.png" />

  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json" />

  <!-- Meta tags -->
  <title>API Manager II</title>
  <meta
    name="description"
    content="Comprehensive API management and monitoring platform for Open Bank Project"
  />
  <meta name="theme-color" content="#3b82f6" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="API Manager II" />
</svelte:head>

<!-- Global Navigation -->
<Navigation {user} {authInfo} />

<!-- Main Content -->
<main class="main-content">
  <slot />
</main>

<style>
  :global(html) {
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
      Cantarell, sans-serif;
    line-height: 1.6;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #f9fafb;
    color: #1f2937;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .main-content {
    flex: 1;
    min-height: 0;
  }

  :global(*) {
    box-sizing: border-box;
  }

  /* Global button styles */
  :global(button) {
    font-family: inherit;
  }

  /* Global link styles */
  :global(a) {
    color: #2563eb;
    text-decoration: none;
  }

  :global(a:hover) {
    text-decoration: underline;
  }

  /* Utility classes */
  :global(.container) {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  /* Responsive breakpoints */
  @media (max-width: 768px) {
    :global(.container) {
      padding: 0 0.75rem;
    }
  }
</style>
