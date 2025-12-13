<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  import {
    extractErrorFromResponse,
    formatErrorForDisplay,
    logErrorDetails,
  } from "$lib/utils/errorHandler";

  let { data }: { data: PageData } = $props();

  const entity = data.entity;

  // Helper function to extract the schema key (FooBar, Guitar, Piano, etc.)
  function getSchemaKey(entity: any): string | null {
    const metadataFields = [
      "entityName",
      "userId",
      "dynamicEntityId",
      "hasPersonalEntity",
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

  const schema = getSchema(entity);
  const schemaKey = getSchemaKey(entity);
  const entityName: string = schemaKey || "Unknown";
  const properties = schema?.properties || {};
  const requiredFields = schema?.required || [];
  const description = schema?.description || "No description available";

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete the system dynamic entity "${entityName}"?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/dynamic-entities/${entity.dynamicEntityId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorDetails = await extractErrorFromResponse(
          response,
          "Failed to delete entity",
        );
        logErrorDetails("Delete Dynamic Entity", errorDetails);
        const errorMessage = formatErrorForDisplay(errorDetails);
        throw new Error(errorMessage);
      }

      alert("System dynamic entity deleted successfully");
      goto("/dynamic-entities/system");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to delete entity";
      alert(`Error: ${errorMsg}`);
      console.error("Delete error:", error);
    }
  }

  function getTypeDisplayName(type: string): string {
    const typeMap: Record<string, string> = {
      string: "Text",
      integer: "Integer",
      number: "Number",
      boolean: "Boolean",
      DATE_WITH_DAY: "Date",
    };
    return typeMap[type] || type;
  }

  function getTypeBadgeColor(type: string): string {
    const colorMap: Record<string, string> = {
      string: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      integer:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      number:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      boolean:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      DATE_WITH_DAY:
        "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    };
    return (
      colorMap[type] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    );
  }

  let exportCopied = $state(false);

  function createExportDefinition(): any {
    // Create the request body needed to recreate this entity
    const exportDef: any = {};
    if (schemaKey) {
      exportDef[schemaKey] = schema;
    }
    return exportDef;
  }

  async function exportDefinition() {
    const exportDef = createExportDefinition();
    const exportJson = JSON.stringify(exportDef, null, 2);

    try {
      await navigator.clipboard.writeText(exportJson);
      exportCopied = true;
      setTimeout(() => {
        exportCopied = false;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy to clipboard");
    }
  }

  async function downloadDefinition() {
    const exportDef = createExportDefinition();
    const exportJson = JSON.stringify(exportDef, null, 2);

    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entityName}_definition.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>{entityName} - System Dynamic Entity - API Manager</title>
</svelte:head>

<div class="container mx-auto max-w-5xl px-4 py-8">
  <!-- Breadcrumb -->
  <div class="mb-6">
    <a
      href="/dynamic-entities/system"
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
      Back to System Dynamic Entities
    </a>

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {entityName}
        </h1>
        <p class="mt-1 text-gray-600 dark:text-gray-400">
          System Dynamic Entity Details
        </p>
      </div>
      <div class="flex gap-2">
        <a
          href="/dynamic-entities/system/{entity.dynamicEntityId}/crud"
          class="inline-flex items-center rounded-lg border border-blue-300 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:border-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600"
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
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            />
          </svg>
          Manage Data (CRUD)
        </a>
        <button
          type="button"
          onclick={exportDefinition}
          class="inline-flex items-center rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 dark:border-green-600 dark:bg-gray-800 dark:text-green-400 dark:hover:bg-green-900/20"
          title="Copy definition to clipboard"
        >
          {#if exportCopied}
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied!
          {:else}
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
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy Definition
          {/if}
        </button>
        <button
          type="button"
          onclick={downloadDefinition}
          class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Download definition as JSON file"
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </button>
        <button
          type="button"
          onclick={handleDelete}
          class="inline-flex items-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-600 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete Entity
        </button>
      </div>
    </div>
  </div>

  <!-- Entity Information Card -->
  <div
    class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
      Entity Information
    </h2>
    <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Entity Name
        </dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
          {entityName}
        </dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Schema Key
        </dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
          {schemaKey}
        </dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Entity ID
        </dt>
        <dd class="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
          {entity.dynamicEntityId}
        </dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
          User ID
        </dt>
        <dd class="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
          {entity.userId}
        </dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Has Personal Entity
        </dt>
        <dd class="mt-1 text-sm">
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
        </dd>
      </div>
      <div class="sm:col-span-2">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Description
        </dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
          {description}
        </dd>
      </div>
    </dl>
  </div>

  <!-- Schema Properties -->
  <div
    class="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="border-b border-gray-200 p-6 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Schema Properties
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {Object.keys(properties).length} properties defined
        {#if requiredFields.length > 0}
          ({requiredFields.length} required)
        {/if}
      </p>
    </div>

    {#if Object.keys(properties).length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          No Properties Defined
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          This entity has no schema properties defined.
        </p>
      </div>
    {:else}
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each Object.entries(properties) as [fieldName, fieldDef]}
          {@const fieldDefTyped = fieldDef as any}
          {@const isRequired = requiredFields.includes(fieldName)}
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3
                    class="font-mono text-base font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {fieldName}
                  </h3>
                  {#if isRequired}
                    <span
                      class="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200"
                    >
                      Required
                    </span>
                  {/if}
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {getTypeBadgeColor(
                      fieldDefTyped.type,
                    )}"
                  >
                    {getTypeDisplayName(fieldDefTyped.type)}
                  </span>
                </div>
                {#if fieldDefTyped.description}
                  <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {fieldDefTyped.description}
                  </p>
                {/if}
                <dl class="mt-3 space-y-1">
                  {#if fieldDefTyped.example !== undefined}
                    <div class="flex gap-2">
                      <dt
                        class="text-sm font-medium text-gray-500 dark:text-gray-400"
                      >
                        Example:
                      </dt>
                      <dd
                        class="font-mono text-sm text-gray-900 dark:text-gray-100"
                      >
                        {typeof fieldDefTyped.example === "boolean"
                          ? fieldDefTyped.example.toString()
                          : fieldDefTyped.example}
                      </dd>
                    </div>
                  {/if}
                  {#if fieldDefTyped.minLength !== undefined}
                    <div class="flex gap-2">
                      <dt
                        class="text-sm font-medium text-gray-500 dark:text-gray-400"
                      >
                        Min Length:
                      </dt>
                      <dd class="text-sm text-gray-900 dark:text-gray-100">
                        {fieldDefTyped.minLength}
                      </dd>
                    </div>
                  {/if}
                  {#if fieldDefTyped.maxLength !== undefined}
                    <div class="flex gap-2">
                      <dt
                        class="text-sm font-medium text-gray-500 dark:text-gray-400"
                      >
                        Max Length:
                      </dt>
                      <dd class="text-sm text-gray-900 dark:text-gray-100">
                        {fieldDefTyped.maxLength}
                      </dd>
                    </div>
                  {/if}
                </dl>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Raw JSON View -->
  <div
    class="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="border-b border-gray-200 p-6 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Raw Schema Definition
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Complete schema definition in JSON format
      </p>
    </div>
    <div class="p-6">
      <pre
        class="overflow-x-auto rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-900"><code
          class="text-gray-900 dark:text-gray-100"
          >{JSON.stringify(schema, null, 2)}</code
        ></pre>
    </div>
  </div>
</div>
