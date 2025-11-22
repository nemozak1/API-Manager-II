<script lang="ts">
  import type { PageData } from "./$types";
  import { onMount, onDestroy } from "svelte";
  import { invalidateAll, goto } from "$app/navigation";
  import { Copy } from "@lucide/svelte";

  let { data }: { data: PageData } = $props();

  // Copy to clipboard function
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  // Clear error message after displaying it
  function clearError() {
    goto("/login", { replaceState: true });
  }

  let refreshInterval: NodeJS.Timeout | undefined;

  function formatProviderName(provider: string): string {
    switch (provider) {
      case "obp-oidc":
        return "OBP OpenID Connect";
      case "keycloak":
        return "Keycloak";
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  }

  onMount(() => {
    // Auto-refresh every 60 seconds to show provider status changes
    refreshInterval = setInterval(() => {
      invalidateAll();
    }, 60000);
  });

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });
</script>

<div class="flex h-full w-full items-center justify-center">
  <div
    class="rounded-xl mx-auto w-auto sm:w-sm md:w-lg h-xl bg-white/10 p-4 max-w-xl backdrop-blur-xs align-middle divide-primary-50-950 divide-y"
  >
    <div class="flex justify-between items-center">
      <h1 class="h2">Login</h1>
    </div>

    {#if data.errorMessage}
      <div
        class="mt-4 p-4 rounded-lg bg-red-500/20 border border-red-500/50 flex items-start justify-between"
      >
        <div class="flex items-start gap-3">
          <span class="text-red-400 text-xl">⚠</span>
          <div>
            <p class="text-red-300 font-semibold">Authentication Failed</p>
            <p class="text-red-200 text-sm mt-1">{data.errorMessage}</p>
          </div>
        </div>
        <button
          type="button"
          onclick={clearError}
          class="text-red-300 hover:text-red-100 ml-2"
          aria-label="Close error message"
        >
          ✕
        </button>
      </div>
    {/if}

    {#if data.availableProviders.length === 0}
      <div class="text-center my-4">
        <div class="mb-4 rounded-lg bg-red-500/20 border border-red-500/50 p-4">
          <p class="text-red-300 font-semibold mb-2">
            No authentication providers available
          </p>

          {#if data.diagnosticInfo}
            <div class="bg-red-900/30 rounded p-3 mb-3 text-left">
              <p class="text-red-200 text-xs font-semibold mb-2">
                Diagnostic Information:
              </p>
              <div class="space-y-1 font-mono text-xs text-red-200">
                <div class="flex justify-between">
                  <span>OBP API URL:</span>
                  <span class="text-red-100"
                    >{data.diagnosticInfo.obpApiUrl}</span
                  >
                </div>
                <div class="flex justify-between">
                  <span>Well-known endpoint:</span>
                  <button
                    type="button"
                    onclick={() =>
                      copyToClipboard(data.diagnosticInfo.wellKnownEndpoint)}
                    class="text-red-100 hover:text-white underline flex items-center gap-1"
                    title="Copy endpoint URL"
                  >
                    {data.diagnosticInfo.wellKnownEndpoint}
                    <Copy class="h-2 w-2" />
                  </button>
                </div>
                <div class="flex justify-between">
                  <span>Provider Manager Ready:</span>
                  <span class="text-red-100"
                    >{data.diagnosticInfo.managerReady ? "Yes" : "No"}</span
                  >
                </div>
                <div class="flex justify-between">
                  <span>Total Providers:</span>
                  <span class="text-red-100"
                    >{data.diagnosticInfo.totalProviders}</span
                  >
                </div>
                <div class="flex justify-between">
                  <span>Available:</span>
                  <span class="text-red-100"
                    >{data.diagnosticInfo.availableCount}</span
                  >
                </div>
                <div class="flex justify-between">
                  <span>Unavailable:</span>
                  <span class="text-red-100"
                    >{data.diagnosticInfo.unavailableCount}</span
                  >
                </div>
              </div>
            </div>
          {/if}

          <p class="text-red-200 text-xs">
            Check the error messages below for each provider to diagnose the
            issue.
          </p>
        </div>

        <!-- Show unavailable providers even when no available providers -->
        {#if data.unavailableProviders.length > 0}
          <div class="mt-6 pt-4 border-t border-gray-600">
            <p class="text-center text-sm text-gray-400 mb-3">
              Currently unavailable:
            </p>
            {#each data.unavailableProviders as provider}
              <div
                class="w-full p-3 rounded-lg border border-gray-600 bg-gray-800/50 opacity-60"
              >
                <div class="flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <span class="text-red-400">●</span>
                    <span class="text-gray-300"
                      >{formatProviderName(provider.provider)}</span
                    >
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-red-400">Unavailable</span>
                    {#if provider.error}
                      <button
                        type="button"
                        onclick={() => copyToClipboard(provider.error || "")}
                        class="text-gray-400 hover:text-gray-200"
                        aria-label="Copy error message"
                        title="Copy error message"
                      >
                        <Copy class="h-3 w-3" />
                      </button>
                    {/if}
                  </div>
                </div>
                {#if provider.error}
                  <div class="text-xs text-gray-400 mt-1 ml-5">
                    {provider.error}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <!-- Available providers -->
      <div class="space-y-3 mt-4">
        <p class="text-center text-sm text-gray-300">
          Choose your authentication provider:
        </p>
        {#each data.availableProviders as provider}
          <button
            type="button"
            class="btn preset-filled-primary-500 mx-auto w-full"
          >
            <a
              href="/login/{provider.provider}"
              class="w-full flex items-center justify-between"
            >
              <span class="flex items-center gap-2">
                <span class="text-green-400">●</span>
                {formatProviderName(provider.provider)}
              </span>
            </a>
          </button>
        {/each}

        <!-- Unavailable providers -->
        {#if data.unavailableProviders.length > 0}
          <div class="mt-6 pt-4 border-t border-gray-600">
            <p class="text-center text-sm text-gray-400 mb-3">
              Currently unavailable:
            </p>
            {#each data.unavailableProviders as provider}
              <div
                class="w-full p-3 rounded-lg border border-gray-600 bg-gray-800/50 opacity-60"
              >
                <div class="flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <span class="text-red-400">●</span>
                    <span class="text-gray-300"
                      >{formatProviderName(provider.provider)}</span
                    >
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-red-400">Unavailable</span>
                    {#if provider.error}
                      <button
                        type="button"
                        onclick={() => copyToClipboard(provider.error || "")}
                        class="text-gray-400 hover:text-gray-200"
                        aria-label="Copy error message"
                        title="Copy error message"
                      >
                        <Copy class="h-3 w-3" />
                      </button>
                    {/if}
                  </div>
                </div>
                {#if provider.error}
                  <div class="text-xs text-gray-400 mt-1 ml-5">
                    {provider.error}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
