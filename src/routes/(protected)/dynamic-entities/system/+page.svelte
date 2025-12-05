<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  import {
    extractErrorFromResponse,
    formatErrorForDisplay,
    logErrorDetails,
  } from "$lib/utils/errorHandler";

  let { data }: { data: PageData } = $props();

  let searchQuery = $state("");

  // Helper function to extract entity name from the entity object
  function getEntityName(entity: any): string {
    // The entity name is the schema key (Piano, Guitar, etc.)
    return getSchemaKey(entity) || "Unknown";
  }

  // Helper function to extract the schema key (FooBar, Guitar, Piano, etc.)
  function getSchemaKey(entity: any): string | null {
    // Find the first key that's not a known metadata field
    const metadataFields = [
      "entityName",
      "userId",
      "dynamicEntityId",
      "hasPersonalEntity",
      "record_count",
    ];
    const keys = Object.keys(entity).filter(
      (key) => !metadataFields.includes(key),
    );
    return keys[0] || null;
  }

  // Helper function to get schema object
  function getSchema(entity: any): any {
    const schemaKey = getSchemaKey(entity);
    return schemaKey ? entity[schemaKey] : null;
  }

  const filteredEntities = $derived(
    (data.entities || []).filter((entity: any) => {
      if (searchQuery === "") return true;

      const query = searchQuery.toLowerCase();
      const entityName = getEntityName(entity).toLowerCase();
      const entityId = (entity.dynamicEntityId || "").toLowerCase();
      const schema = getSchema(entity);
      const description = schema?.description?.toLowerCase() || "";

      return (
        entityName.includes(query) ||
        entityId.includes(query) ||
        description.includes(query)
      );
    }),
  );

  async function deleteEntity(entityId: string, cascade: boolean = false) {
    const confirmMessage = cascade
      ? "Are you sure you want to delete this system dynamic entity AND ALL ITS DATA (cascade)? This cannot be undone!"
      : "Are you sure you want to delete this system dynamic entity?";

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const url = cascade
        ? `/api/dynamic-entities/${entityId}?cascade=true`
        : `/api/dynamic-entities/${entityId}`;

      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorDetails = await extractErrorFromResponse(
          response,
          "Failed to delete entity",
        );
        logErrorDetails("Delete System Dynamic Entity", errorDetails);
        const errorMessage = formatErrorForDisplay(errorDetails);
        throw new Error(errorMessage);
      }

      alert("System dynamic entity deleted successfully");
      window.location.reload();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to delete system dynamic entity";
      alert(`Error: ${errorMsg}`);
      console.error("Delete error:", error);
    }
  }

  function getPropertyCount(entity: any): number {
    const schema = getSchema(entity);
    return schema?.properties ? Object.keys(schema.properties).length : 0;
  }

  function getRequiredFieldsCount(entity: any): number {
    const schema = getSchema(entity);
    return schema?.required ? schema.required.length : 0;
  }
</script>

<svelte:head>
  <title>System Dynamic Entities - API Manager</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
        System Dynamic Entities
      </h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">
        Manage system-wide dynamic data entities
      </p>
    </div>
    <a
      href="/dynamic-entities/system/create"
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
      Create Dynamic Entity
    </a>
  </div>

  <!-- Stats -->
  <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div
      class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="text-sm text-gray-600 dark:text-gray-400">Total Entities</div>
      <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {data.entities?.length || 0}
      </div>
    </div>
  </div>

  <!-- Error Message -->
  {#if data.error}
    <div
      class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
    >
      <div class="flex items-start">
        <svg
          class="mr-3 h-5 w-5 text-red-600 dark:text-red-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <div>
          <h3 class="font-semibold text-red-800 dark:text-red-300">
            Error Loading Entities
          </h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-400">
            {data.error}
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Search and Filters -->
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
    <div class="flex-1">
      <div class="relative">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search by entity name, ID, or description..."
          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
        />
        <svg
          class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
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

  <!-- Entities List -->
  <div>
    {#if filteredEntities.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        {#if !data.entities || data.entities.length === 0}
          <svg
            class="mb-4 h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3
            class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            No System Dynamic Entities Found
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            There are currently no system dynamic entities defined.
          </p>
        {:else}
          <svg
            class="mb-4 h-16 w-16 text-gray-400"
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
          <h3
            class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            No Matching Entities
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            No entities match your search criteria. Try adjusting your filters.
          </p>
        {/if}
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Entity Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Description
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Properties
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Required Fields
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Records
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Personal
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
              {@const schema = getSchema(entity)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <a
                    href="/dynamic-entities/system/{entity.dynamicEntityId}"
                    class="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {getEntityName(entity)}
                  </a>
                </td>
                <td
                  class="max-w-md px-6 py-4 text-sm text-gray-700 dark:text-gray-300"
                >
                  {schema?.description || "No description"}
                </td>
                <td
                  class="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span
                    class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {getPropertyCount(entity)}
                  </span>
                </td>
                <td
                  class="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span
                    class="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  >
                    {getRequiredFieldsCount(entity)}
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm">
                  <span class="font-medium text-gray-900 dark:text-gray-100">
                    {entity.record_count}
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm">
                  {#if entity.hasPersonalEntity}
                    <span
                      class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      Yes
                    </span>
                  {:else}
                    <span
                      class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    >
                      No
                    </span>
                  {/if}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      onclick={() =>
                        goto(
                          `/dynamic-entities/system/${entity.dynamicEntityId}`,
                        )}
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
                    </button>
                    <button
                      type="button"
                      onclick={() =>
                        deleteEntity(entity.dynamicEntityId, false)}
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete Entity Definition"
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
                    <button
                      type="button"
                      onclick={() => deleteEntity(entity.dynamicEntityId, true)}
                      class="text-red-800 hover:text-red-950 dark:text-red-500 dark:hover:text-red-400"
                      title="Delete Entity + All Data (CASCADE)"
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
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
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

      <!-- Results Summary -->
      <div
        class="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700"
      >
        <div class="text-sm text-gray-700 dark:text-gray-300">
          Showing <span class="font-medium">{filteredEntities.length}</span>
          of
          <span class="font-medium">{data.entities?.length || 0}</span>
          entities
        </div>
      </div>
    {/if}
  </div>
</div>
