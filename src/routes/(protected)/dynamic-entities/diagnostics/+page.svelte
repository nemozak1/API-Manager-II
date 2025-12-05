<script lang="ts">
  import type { PageData } from "./$types";

  let { data } = $props();
  const diagnostics = data.diagnostics || [];
  const totalEntities = data.totalEntities || 0;
  const totalRecords = data.totalRecords || 0;

  let searchQuery = $state("");

  const filteredDiagnostics = $derived(
    diagnostics.filter((diag: any) => {
      if (searchQuery === "") return true;

      const query = searchQuery.toLowerCase();
      return (
        diag.entityName.toLowerCase().includes(query) ||
        diag.dynamicEntityId.toLowerCase().includes(query)
      );
    }),
  );

  function getStatusColor(diag: any): string {
    if (diag.error) return "text-red-600 dark:text-red-400";
    if (diag.recordCount === 0) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  }

  function getStatusBadgeColor(diag: any): string {
    if (diag.error)
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (diag.recordCount === 0)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  }

  function getStatusText(diag: any): string {
    if (diag.error) return "Error";
    if (diag.recordCount === 0) return "No Records";
    return "Has Data";
  }

  function getPropertyCount(schema: any): number {
    return schema?.properties ? Object.keys(schema.properties).length : 0;
  }
</script>

<h1 class="text-gray-900 dark:text-gray-100">Dynamic Entity Diagnostics</h1>

<p class="mb-4 text-gray-700 dark:text-gray-300">
  View all dynamic entities and their record counts to diagnose data issues.
</p>

<!-- Summary Cards -->
<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
  <!-- Total Entities -->
  <div
    class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          Total Entities
        </p>
        <p class="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {totalEntities}
        </p>
      </div>
      <svg
        class="h-12 w-12 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
        />
      </svg>
    </div>
  </div>

  <!-- Total Records -->
  <div
    class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          Total Records
        </p>
        <p class="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {totalRecords}
        </p>
      </div>
      <svg
        class="h-12 w-12 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
  </div>

  <!-- Entities with Data -->
  <div
    class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          With Data
        </p>
        <p class="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {diagnostics.filter((d: any) => d.recordCount > 0 && !d.error).length}
        </p>
      </div>
      <svg
        class="h-12 w-12 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  </div>
</div>

<!-- Search -->
<div class="mb-6">
  <input
    type="text"
    bind:value={searchQuery}
    placeholder="Search by entity name or ID..."
    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
  />
</div>

<!-- Entity List -->
{#if filteredDiagnostics && filteredDiagnostics.length > 0}
  <div class="space-y-4">
    {#each filteredDiagnostics as diag (diag.dynamicEntityId)}
      <div
        class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <!-- Header -->
        <div class="mb-4 flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h2
                class="text-xl font-semibold text-gray-900 dark:text-gray-100"
              >
                {diag.entityName}
              </h2>
              <span
                class="rounded-full px-3 py-1 text-xs font-medium {getStatusBadgeColor(
                  diag,
                )}"
              >
                {getStatusText(diag)}
              </span>
            </div>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              ID: {diag.dynamicEntityId}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Record Count
            </p>
            <p class="text-3xl font-bold {getStatusColor(diag)}">
              {diag.error ? "Unknown" : diag.recordCount}
            </p>
          </div>
        </div>

        <!-- Details -->
        <div
          class="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50 sm:grid-cols-2"
        >
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Schema Properties
            </p>
            <p
              class="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {getPropertyCount(diag.schema)}
            </p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Status
            </p>
            <div class="mt-1">
              {#if diag.error}
                <p class="text-sm font-semibold {getStatusColor(diag)}">
                  {diag.error}
                </p>
                {#if diag.responseKeys && diag.responseKeys.length > 0}
                  <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Response keys:</strong>
                    {diag.responseKeys.join(", ")}
                  </p>
                {/if}
                {#if diag.triedKeys && diag.triedKeys.length > 0}
                  <p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Tried keys:</strong>
                    {diag.triedKeys.join(", ")}
                  </p>
                {/if}
              {:else if diag.recordCount === 0}
                <p class="text-sm font-semibold {getStatusColor(diag)}">
                  No records found
                </p>
              {:else}
                <p class="text-lg font-semibold {getStatusColor(diag)}">
                  {diag.recordCount} record{diag.recordCount !== 1 ? "s" : ""}
                </p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-4 flex gap-2">
          <a
            href="/dynamic-entities/system/{diag.dynamicEntityId}/crud"
            class="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
          >
            View CRUD
          </a>
          <a
            href="/dynamic-entities/system/{diag.dynamicEntityId}"
            class="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            View Definition
          </a>
        </div>
      </div>
    {/each}
  </div>
{:else if searchQuery}
  <div class="rounded-lg bg-gray-100 p-8 text-center dark:bg-gray-800">
    <svg
      class="mx-auto mb-4 h-16 w-16 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
    <p class="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
      No results found
    </p>
    <p class="text-gray-600 dark:text-gray-400">
      No entities match your search criteria.
    </p>
  </div>
{:else}
  <div class="rounded-lg bg-gray-100 p-8 text-center dark:bg-gray-800">
    <svg
      class="mx-auto mb-4 h-16 w-16 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
      />
    </svg>
    <p class="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
      No dynamic entities found
    </p>
    <p class="text-gray-600 dark:text-gray-400">
      There are no system dynamic entities configured.
    </p>
  </div>
{/if}
