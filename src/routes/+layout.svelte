<script lang="ts">
  import "../app.css";
  import Navigation from "$lib/components/Navigation.svelte";
  import favicon from "$lib/assets/favicon.svg";

  // Get data from layout server
  export let data: any = {};
  $: user = data?.user;
  $: authInfo = data?.authInfo;
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>API Manager II</title>
  <meta
    name="description"
    content="Comprehensive API management and monitoring platform for Open Bank Project"
  />
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
  }

  .main-content {
    min-height: calc(100vh - 4rem); /* Account for navigation height */
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
