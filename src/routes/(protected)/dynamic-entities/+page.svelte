<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";

  export let data: PageData;

  let searchQuery = "";
  let selectedDefinition = "all";

  $: filteredEntities = (data.entities || []).filter((entity) => {
    const matchesSearch =
      searchQuery === "" ||
      entity.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.definition_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(entity.data)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesDefinition =
      selectedDefinition === "all" ||
      entity.definition_id === selectedDefinition;

    return matchesSearch && matchesDefinition;
  });

  $: definitionOptions = [
    "all",
    ...new Set((data.entities || []).map((e) => e.definition_id)),
  ];

  async function deleteEntity(entityId: string) {
    if (!confirm("Are you sure you want to delete this dynamic entity?")) {
      return;
    }

    try {
      const response = await fetch(`/api/dynamic-entities/${entityId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete entity");
      }

      alert("Dynamic entity deleted successfully");
      window.location.reload();
    } catch (error) {
      alert("Failed to delete dynamic entity");
      console.error("Delete error:", error);
    }
  }

  function getDefinitionName(definitionId: string): string {
    const definition = (data.definitions || []).find(
      (d) => d.id === definitionId,
    );
    return definition?.name || definitionId;
  }

  function getFieldPreview(entityData: Record<string, any>): string {
    const keys = Object.keys(entityData).slice(0, 3);
    if (keys.length === 0) return "No data";
    const preview = keys.map((key) => `${key}: ${entityData[key]}`).join(", ");
    return preview.length > 50 ? preview.substring(0, 50) + "..." : preview;
  }
</script>

<svelte:head>
  <title>Dynamic Entities - API Manager</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Dynamic Entities
      </h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">
        Manage dynamic data entities based on custom definitions
      </p>
    </div>
    <div class="flex gap-2">
      <a
        href="/dynamic-entities/definitions"
        class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg
          class="mr-2 h-4 w-4"
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
        Manage Definitions
      </a>
      <a
        href="/dynamic-entities/create"
        class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        <svg
          class="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create Entity
      </a>
    </div>
  </div>

  <!-- API Not Available Warning -->
  {#if data.error}
    <div
      class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950"
    >
      <div class="flex items-start">
        <svg
          class="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600 dark:text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <h3 class="text-lg font-semibold text-amber-900 dark:text-amber-100">
            Dynamic Entities API Not Available
          </h3>
          <p class="mt-2 text-sm text-amber-800 dark:text-amber-200">
            The Dynamic Entities management endpoints are not available in your
            OBP API instance. This feature may require:
          </p>
          <ul
            class="mt-2 ml-4 list-disc text-sm text-amber-800 dark:text-amber-200"
          >
            <li>A newer version of the OBP API</li>
            <li>Specific entitlements or permissions</li>
            <li>Configuration on the OBP server</li>
          </ul>
          <p class="mt-3 text-sm text-amber-800 dark:text-amber-200">
            <strong>Endpoint:</strong>
            <code class="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900"
              >/obp/v6.0.0/management/dynamic-entity-definitions</code
            >
          </p>
          <p class="mt-1 text-sm text-amber-800 dark:text-amber-200">
            <strong>Error:</strong>
            {data.error}
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Stats Cards -->
  <div class="mb-6 grid gap-4 md:grid-cols-3">
    <div
      class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Entities
          </p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {data.entities?.length || 0}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Across all definitions
          </p>
        </div>
        <div class="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
          <svg
            class="h-6 w-6 text-blue-600 dark:text-blue-400"
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
        </div>
      </div>
    </div>

    <div
      class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
            Active Definitions
          </p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {data.definitions?.length || 0}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Entity type definitions
          </p>
        </div>
        <div class="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
          <svg
            class="h-6 w-6 text-green-600 dark:text-green-400"
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
    </div>

    <div
      class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
            Filtered Results
          </p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {filteredEntities.length}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Matching current filters
          </p>
        </div>
        <div class="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
          <svg
            class="h-6 w-6 text-purple-600 dark:text-purple-400"
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
        </div>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div
    class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
      Filters
    </h2>
    <div class="flex gap-4">
      <div class="flex-1">
        <div class="relative">
          <div
            class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
          >
            <svg
              class="h-5 w-5 text-gray-400"
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
          </div>
          <input
            type="search"
            placeholder="Search entities by ID or data..."
            class="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            bind:value={searchQuery}
          />
        </div>
      </div>
      <div class="w-64">
        <select
          class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          bind:value={selectedDefinition}
        >
          {#each definitionOptions as option}
            <option value={option}>
              {option === "all" ? "All Definitions" : getDefinitionName(option)}
            </option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Entities Table -->
  <div
    class="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="border-b border-gray-200 p-6 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Entities
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {filteredEntities.length}
        {filteredEntities.length === 1 ? "entity" : "entities"} found
      </p>
    </div>

    {#if filteredEntities.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <svg
          class="mb-4 h-12 w-12 text-gray-400"
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
        <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          No entities found
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-400">
          {!data.entities || data.entities.length === 0
            ? "Get started by creating your first dynamic entity"
            : "Try adjusting your search or filter criteria"}
        </p>
        {#if !data.entities || data.entities.length === 0}
          <a
            href="/dynamic-entities/create"
            class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <svg
              class="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create First Entity
          </a>
        {/if}
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Entity ID
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Definition
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Data Preview
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Created
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Updated
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody
            class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800"
          >
            {#each filteredEntities as entity}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td
                  class="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-900 dark:text-gray-100"
                >
                  {entity.id}
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span
                    class="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {getDefinitionName(entity.definition_id)}
                  </span>
                </td>
                <td
                  class="max-w-md truncate px-6 py-4 text-sm text-gray-500 dark:text-gray-400"
                >
                  {getFieldPreview(entity.data)}
                </td>
                <td
                  class="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400"
                >
                  {new Date(entity.created_at).toLocaleDateString()}
                </td>
                <td
                  class="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400"
                >
                  {new Date(entity.updated_at).toLocaleDateString()}
                </td>
                <td
                  class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium"
                >
                  <div class="flex justify-end gap-2">
                    <a
                      href="/dynamic-entities/{entity.id}"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="View Details"
                    >
                      <svg
                        class="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </a>
                    <a
                      href="/dynamic-entities/{entity.id}/edit"
                      class="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                      title="Edit Entity"
                    >
                      <svg
                        class="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </a>
                    <button
                      on:click={() => deleteEntity(entity.id)}
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete"
                    >
                      <svg
                        class="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
