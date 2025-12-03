<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";

  export let data: PageData;

  let searchQuery = "";
  let showCreateDialog = false;
  let showViewDialog = false;
  let showEditDialog = false;
  let selectedDefinition: any = null;

  // Form state
  let formName = "";
  let formDescription = "";
  let formSchema =
    '{\n  "field_name": {\n    "type": "string",\n    "required": true,\n    "description": "Field description"\n  }\n}';
  let formVersion = "1.0";
  let isSubmitting = false;
  let schemaError = "";

  $: filteredDefinitions = (data.definitions || []).filter((def) => {
    const query = searchQuery.toLowerCase();
    return (
      query === "" ||
      def.name.toLowerCase().includes(query) ||
      (def.description && def.description.toLowerCase().includes(query)) ||
      def.id.toLowerCase().includes(query)
    );
  });

  $: totalEntities = (data.definitions || []).reduce(
    (sum, def) => sum + (def.entity_count || 0),
    0,
  );

  function validateSchema(schemaStr: string): boolean {
    try {
      const parsed = JSON.parse(schemaStr);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        schemaError = "Schema must be a JSON object";
        return false;
      }
      schemaError = "";
      return true;
    } catch (err) {
      schemaError = "Invalid JSON format";
      return false;
    }
  }

  function resetForm() {
    formName = "";
    formDescription = "";
    formSchema =
      '{\n  "field_name": {\n    "type": "string",\n    "required": true,\n    "description": "Field description"\n  }\n}';
    formVersion = "1.0";
    schemaError = "";
  }

  function openCreateDialog() {
    resetForm();
    showCreateDialog = true;
  }

  function openEditDialog(definition: any) {
    selectedDefinition = definition;
    formName = definition.name;
    formDescription = definition.description || "";
    formSchema = JSON.stringify(definition.schema, null, 2);
    formVersion = definition.version || "1.0";
    schemaError = "";
    showEditDialog = true;
  }

  function openViewDialog(definition: any) {
    selectedDefinition = definition;
    showViewDialog = true;
  }

  async function handleCreate(e: Event) {
    e.preventDefault();

    if (!formName.trim()) {
      alert("Name is required");
      return;
    }

    if (!validateSchema(formSchema)) {
      alert("Please fix schema errors");
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch("/api/dynamic-entity-definitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription || null,
          schema: JSON.parse(formSchema),
          version: formVersion,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create definition");
      }

      alert("Definition created successfully");
      showCreateDialog = false;
      window.location.reload();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to create definition",
      );
      console.error("Create error:", error);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleUpdate(e: Event) {
    e.preventDefault();

    if (!selectedDefinition || !formName.trim()) {
      alert("Name is required");
      return;
    }

    if (!validateSchema(formSchema)) {
      alert("Please fix schema errors");
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch(
        `/api/dynamic-entity-definitions/${selectedDefinition.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formName,
            description: formDescription || null,
            schema: JSON.parse(formSchema),
            version: formVersion,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update definition");
      }

      alert("Definition updated successfully");
      showEditDialog = false;
      window.location.reload();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to update definition",
      );
      console.error("Update error:", error);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDelete(definitionId: string, entityCount: number) {
    if (entityCount > 0) {
      if (
        !confirm(
          `This definition has ${entityCount} entities. Deleting it will also delete all associated entities. Are you sure?`,
        )
      ) {
        return;
      }
    } else {
      if (!confirm("Are you sure you want to delete this definition?")) {
        return;
      }
    }

    try {
      const response = await fetch(
        `/api/dynamic-entity-definitions/${definitionId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete definition");
      }

      alert("Definition deleted successfully");
      window.location.reload();
    } catch (error) {
      alert("Failed to delete definition");
      console.error("Delete error:", error);
    }
  }

  function duplicateDefinition(definition: any) {
    selectedDefinition = definition;
    formName = `${definition.name} (Copy)`;
    formDescription = definition.description || "";
    formSchema = JSON.stringify(definition.schema, null, 2);
    formVersion = definition.version || "1.0";
    schemaError = "";
    showCreateDialog = true;
  }

  function getFieldCount(schema: any): number {
    return Object.keys(schema || {}).length;
  }

  function getRequiredFieldCount(schema: any): number {
    return Object.values(schema || {}).filter((field: any) => field.required)
      .length;
  }
</script>

<svelte:head>
  <title>Entity Definitions - API Manager</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-6">
    <a
      href="/dynamic-entities"
      class="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Back to Entities
    </a>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Entity Definitions
        </h1>
        <p class="mt-1 text-gray-600 dark:text-gray-400">
          Manage dynamic entity type definitions and schemas
        </p>
      </div>
      <button
        on:click={openCreateDialog}
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
        Create Definition
      </button>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="mb-6 grid gap-4 md:grid-cols-3">
    <div
      class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Definitions
          </p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {data.definitions?.length || 0}
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
            Total Entities
          </p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {totalEntities}
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
            {filteredDefinitions.length}
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

  <!-- Search -->
  <div
    class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
      Search
    </h2>
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
        placeholder="Search definitions..."
        class="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
        bind:value={searchQuery}
      />
    </div>
  </div>

  <!-- Definitions Table -->
  <div
    class="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="border-b border-gray-200 p-6 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Definitions
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {filteredDefinitions.length}
        {filteredDefinitions.length === 1 ? "definition" : "definitions"} found
      </p>
    </div>

    {#if !data.definitions || filteredDefinitions.length === 0}
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
          No definitions found
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-400">
          {!data.definitions || data.definitions.length === 0
            ? "Get started by creating your first entity definition"
            : "Try adjusting your search criteria"}
        </p>
        {#if !data.definitions || data.definitions.length === 0}
          <button
            on:click={openCreateDialog}
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
            Create First Definition
          </button>
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
                Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Description
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Fields
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Entities
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Version
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
            {#each filteredDefinitions as definition}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td
                  class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  {definition.name}
                </td>
                <td
                  class="max-w-md truncate px-6 py-4 text-sm text-gray-500 dark:text-gray-400"
                >
                  {definition.description || "No description"}
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <div class="flex gap-2">
                    <span
                      class="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {getFieldCount(definition.schema)} total
                    </span>
                    {#if getRequiredFieldCount(definition.schema) > 0}
                      <span
                        class="inline-flex rounded-full border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {getRequiredFieldCount(definition.schema)} required
                      </span>
                    {/if}
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span
                    class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {definition.entity_count >
                    0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}"
                  >
                    {definition.entity_count || 0}
                  </span>
                </td>
                <td
                  class="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400"
                >
                  {definition.version || "1.0"}
                </td>
                <td
                  class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium"
                >
                  <div class="flex justify-end gap-2">
                    <button
                      on:click={() => openViewDialog(definition)}
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="View Schema"
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
                      on:click={() => openEditDialog(definition)}
                      class="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                      title="Edit"
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
                    </button>
                    <button
                      on:click={() => duplicateDefinition(definition)}
                      class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      title="Duplicate"
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
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <button
                      on:click={() =>
                        handleDelete(definition.id, definition.entity_count)}
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

<!-- Create/Duplicate Dialog -->
{#if showCreateDialog}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    on:click={() => (showCreateDialog = false)}
  >
    <div
      class="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0"
    >
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      ></div>
      <span class="hidden sm:inline-block sm:h-screen sm:align-middle"
        >&#8203;</span
      >
      <div
        class="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-3xl sm:align-middle"
        on:click|stopPropagation
      >
        <form on:submit={handleCreate}>
          <div class="bg-white px-4 pb-4 pt-5 dark:bg-gray-800 sm:p-6 sm:pb-4">
            <h3
              class="mb-4 text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
            >
              Create Entity Definition
            </h3>
            <div class="space-y-4">
              <div>
                <label
                  for="create-name"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Name *
                </label>
                <input
                  type="text"
                  id="create-name"
                  bind:value={formName}
                  placeholder="e.g., Product, Customer, Order"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label
                  for="create-description"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="create-description"
                  bind:value={formDescription}
                  rows="2"
                  placeholder="Describe what this entity type represents..."
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                ></textarea>
              </div>
              <div>
                <label
                  for="create-version"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Version
                </label>
                <input
                  type="text"
                  id="create-version"
                  bind:value={formVersion}
                  placeholder="e.g., 1.0"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  for="create-schema"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Schema (JSON) *
                </label>
                <textarea
                  id="create-schema"
                  bind:value={formSchema}
                  on:input={() => validateSchema(formSchema)}
                  rows="12"
                  placeholder="Enter JSON schema..."
                  class="mt-1 block w-full rounded-lg border px-3 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 {schemaError
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'}"
                  required
                ></textarea>
                {#if schemaError}
                  <p class="mt-1 text-sm text-red-600">{schemaError}</p>
                {/if}
              </div>
            </div>
          </div>
          <div
            class="bg-gray-50 px-4 py-3 dark:bg-gray-900/50 sm:flex sm:flex-row-reverse sm:px-6"
          >
            <button
              type="submit"
              disabled={isSubmitting}
              class="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:ml-3 sm:w-auto"
            >
              {isSubmitting ? "Creating..." : "Create Definition"}
            </button>
            <button
              type="button"
              on:click={() => (showCreateDialog = false)}
              class="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Dialog -->
{#if showEditDialog && selectedDefinition}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    on:click={() => (showEditDialog = false)}
  >
    <div
      class="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0"
    >
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      ></div>
      <span class="hidden sm:inline-block sm:h-screen sm:align-middle"
        >&#8203;</span
      >
      <div
        class="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-3xl sm:align-middle"
        on:click|stopPropagation
      >
        <form on:submit={handleUpdate}>
          <div class="bg-white px-4 pb-4 pt-5 dark:bg-gray-800 sm:p-6 sm:pb-4">
            <h3
              class="mb-4 text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
            >
              Edit Entity Definition
            </h3>
            <div class="space-y-4">
              <div>
                <label
                  for="edit-name"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Name *</label
                >
                <input
                  type="text"
                  id="edit-name"
                  bind:value={formName}
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label
                  for="edit-description"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Description</label
                >
                <textarea
                  id="edit-description"
                  bind:value={formDescription}
                  rows="2"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                ></textarea>
              </div>
              <div>
                <label
                  for="edit-version"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Version</label
                >
                <input
                  type="text"
                  id="edit-version"
                  bind:value={formVersion}
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  for="edit-schema"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Schema (JSON) *</label
                >
                <textarea
                  id="edit-schema"
                  bind:value={formSchema}
                  on:input={() => validateSchema(formSchema)}
                  rows="12"
                  class="mt-1 block w-full rounded-lg border px-3 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 {schemaError
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'}"
                  required
                ></textarea>
                {#if schemaError}
                  <p class="mt-1 text-sm text-red-600">{schemaError}</p>
                {/if}
              </div>
              {#if selectedDefinition?.entity_count > 0}
                <div
                  class="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950"
                >
                  <p class="text-sm text-amber-800 dark:text-amber-200">
                    ⚠️ Warning: This definition has {selectedDefinition.entity_count}
                    existing entities. Changing the schema may affect data validation.
                  </p>
                </div>
              {/if}
            </div>
          </div>
          <div
            class="bg-gray-50 px-4 py-3 dark:bg-gray-900/50 sm:flex sm:flex-row-reverse sm:px-6"
          >
            <button
              type="submit"
              disabled={isSubmitting}
              class="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:ml-3 sm:w-auto"
            >
              {isSubmitting ? "Updating..." : "Update Definition"}
            </button>
            <button
              type="button"
              on:click={() => (showEditDialog = false)}
              class="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto"
              >Cancel</button
            >
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- View Dialog -->
{#if showViewDialog && selectedDefinition}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    on:click={() => (showViewDialog = false)}
  >
    <div
      class="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0"
    >
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      ></div>
      <span class="hidden sm:inline-block sm:h-screen sm:align-middle"
        >&#8203;</span
      >
      <div
        class="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-3xl sm:align-middle"
        on:click|stopPropagation
      >
        <div class="bg-white px-4 pb-4 pt-5 dark:bg-gray-800 sm:p-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            {selectedDefinition.name}
          </h3>
          {#if selectedDefinition.description}
            <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {selectedDefinition.description}
            </p>
          {/if}
          <div class="mb-4 grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Version</p>
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {selectedDefinition.version || "1.0"}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Entities</p>
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {selectedDefinition.entity_count || 0}
              </p>
            </div>
          </div>
          <div class="mb-4">
            <div class="mb-2 flex items-center justify-between">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Schema
              </p>
              <button
                on:click={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(selectedDefinition.schema, null, 2),
                  );
                  alert("Schema copied to clipboard");
                }}
                class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >📋 Copy</button
              >
            </div>
            <div
              class="overflow-x-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50"
            >
              <pre
                class="text-sm font-mono text-gray-900 dark:text-gray-100">{JSON.stringify(
                  selectedDefinition.schema,
                  null,
                  2,
                )}</pre>
            </div>
          </div>
        </div>
        <div
          class="bg-gray-50 px-4 py-3 dark:bg-gray-900/50 sm:flex sm:flex-row-reverse sm:px-6"
        >
          <button
            on:click={() => openEditDialog(selectedDefinition)}
            class="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto"
            >Edit Definition</button
          >
          <button
            on:click={() => (showViewDialog = false)}
            class="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto"
            >Close</button
          >
        </div>
      </div>
    </div>
  </div>
{/if}
