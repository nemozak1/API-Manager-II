<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const entity = data.entity;

  // Helper function to extract the schema key
  function getSchemaKey(entity: any): string {
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
  const entityName = schemaKey || "Unknown";
  const properties = schema?.properties || {};
  const requiredFields = schema?.required || [];

  let dataRecords = $state(data.dataRecords || []);
  let searchQuery = $state("");
  let showCreateModal = $state(false);
  let showEditModal = $state(false);
  let showViewModal = $state(false);
  let selectedRecord: any = $state(null);
  let isSubmitting = $state(false);

  // Form data for create/edit
  let formData: Record<string, any> = $state({});
  let validationErrors: Record<string, string> = $state({});

  // Filter records based on search
  let filteredRecords = $derived(
    dataRecords.filter((record) => {
      if (searchQuery === "") return true;
      const query = searchQuery.toLowerCase();
      const recordString = JSON.stringify(record).toLowerCase();
      return recordString.includes(query);
    }),
  );

  function initializeFormData(record?: any) {
    formData = {};
    Object.keys(properties).forEach((fieldName) => {
      formData[fieldName] = record ? record[fieldName] : "";
    });
    validationErrors = {};
  }

  function openCreateModal() {
    initializeFormData();
    showCreateModal = true;
  }

  function openEditModal(record: any) {
    selectedRecord = record;
    initializeFormData(record);
    showEditModal = true;
  }

  function openViewModal(record: any) {
    selectedRecord = record;
    showViewModal = true;
  }

  function closeModals() {
    showCreateModal = false;
    showEditModal = false;
    showViewModal = false;
    selectedRecord = null;
    formData = {};
    validationErrors = {};
  }

  function validateField(fieldName: string, value: any): string | null {
    const fieldDef = properties[fieldName];
    const isRequired = requiredFields.includes(fieldName);

    if (isRequired && (!value || value === "")) {
      return "This field is required";
    }

    if (value && value !== "") {
      switch (fieldDef.type) {
        case "integer":
          if (!/^-?\d+$/.test(value.toString())) {
            return "Must be a valid integer";
          }
          break;
        case "number":
          if (isNaN(Number(value))) {
            return "Must be a valid number";
          }
          break;
        case "boolean":
          // Accept true/false or convert from string
          break;
        case "DATE_WITH_DAY":
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return "Must be in format YYYY-MM-DD";
          }
          break;
      }

      if (fieldDef.minLength && value.length < fieldDef.minLength) {
        return `Must be at least ${fieldDef.minLength} characters`;
      }
      if (fieldDef.maxLength && value.length > fieldDef.maxLength) {
        return `Must be at most ${fieldDef.maxLength} characters`;
      }
    }

    return null;
  }

  function validateAllFields(): boolean {
    let isValid = true;
    validationErrors = {};

    Object.keys(properties).forEach((fieldName) => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        validationErrors[fieldName] = error;
        isValid = false;
      }
    });

    return isValid;
  }

  async function handleCreate() {
    if (!validateAllFields()) {
      alert("Please fix validation errors");
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch(
        `/api/dynamic-entities/${entity.dynamicEntityId}/data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create record");
      }

      const result = await response.json();
      dataRecords = [...dataRecords, result];
      alert("Record created successfully");
      closeModals();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create record");
      console.error("Create error:", error);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleUpdate() {
    if (!validateAllFields()) {
      alert("Please fix validation errors");
      return;
    }

    if (!selectedRecord?.id) {
      alert("No record ID found");
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch(
        `/api/dynamic-entities/${entity.dynamicEntityId}/data/${selectedRecord.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update record");
      }

      const result = await response.json();
      dataRecords = dataRecords.map((r) =>
        r.id === selectedRecord.id ? result : r,
      );
      alert("Record updated successfully");
      closeModals();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update record");
      console.error("Update error:", error);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDelete(record: any) {
    if (!confirm("Are you sure you want to delete this record?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/dynamic-entities/${entity.dynamicEntityId}/data/${record.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete record");
      }

      dataRecords = dataRecords.filter((r) => r.id !== record.id);
      alert("Record deleted successfully");
    } catch (error) {
      alert("Failed to delete record");
      console.error("Delete error:", error);
    }
  }

  function renderFieldInput(fieldName: string, fieldDef: any) {
    const type = fieldDef.type;
    const value = formData[fieldName] ?? "";

    switch (type) {
      case "boolean":
        return "checkbox";
      case "integer":
      case "number":
        return "number";
      case "DATE_WITH_DAY":
        return "date";
      default:
        return "text";
    }
  }
</script>

<svelte:head>
  <title>Manage {entityName} Data - CRUD - API Manager</title>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
  <!-- Breadcrumb -->
  <div class="mb-6">
    <div class="flex items-center gap-2 text-sm">
      <a
        href="/dynamic-entities/system"
        class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        System Dynamic Entities
      </a>
      <span class="text-gray-400">/</span>
      <a
        href="/dynamic-entities/system/{entity.dynamicEntityId}"
        class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        {entityName}
      </a>
      <span class="text-gray-400">/</span>
      <span class="text-gray-600 dark:text-gray-400">Data Management</span>
    </div>
  </div>

  <!-- Header -->
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Manage {entityName} Data
      </h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">
        Create, read, update, and delete records for this entity
      </p>
    </div>
    <button
      type="button"
      onclick={openCreateModal}
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
      Create Record
    </button>
  </div>

  <!-- Stats -->
  <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div
      class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="text-sm text-gray-600 dark:text-gray-400">Total Records</div>
      <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {dataRecords.length}
      </div>
    </div>
    <div
      class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Filtered Results
      </div>
      <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {filteredRecords.length}
      </div>
    </div>
    <div
      class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="text-sm text-gray-600 dark:text-gray-400">Properties</div>
      <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {Object.keys(properties).length}
      </div>
    </div>
  </div>

  <!-- Search -->
  <div class="mb-6">
    <div class="relative">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search records..."
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

  <!-- Records Table -->
  <div
    class="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    {#if filteredRecords.length === 0}
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
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {dataRecords.length === 0 ? "No Records Yet" : "No Matching Records"}
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-400">
          {dataRecords.length === 0
            ? "Get started by creating your first record"
            : "Try adjusting your search criteria"}
        </p>
        {#if dataRecords.length === 0}
          <button
            type="button"
            onclick={openCreateModal}
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
            Create First Record
          </button>
        {/if}
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              {#each Object.keys(properties).slice(0, 4) as fieldName}
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {fieldName}
                </th>
              {/each}
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
            {#each filteredRecords as record, index}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {#each Object.keys(properties).slice(0, 4) as fieldName}
                  <td
                    class="max-w-xs truncate px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {record[fieldName] !== undefined &&
                    record[fieldName] !== null
                      ? String(record[fieldName])
                      : "-"}
                  </td>
                {/each}
                <td class="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      onclick={() => openViewModal(record)}
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="View"
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
                      onclick={() => openEditModal(record)}
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
                      type="button"
                      onclick={() => handleDelete(record)}
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
                          d="M19 7l-.867 12.142A2 1 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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

<!-- Create Modal -->
{#if showCreateModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    onclick={(e) => e.target === e.currentTarget && closeModals()}
  >
    <div
      class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white dark:bg-gray-800"
    >
      <div
        class="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Create New Record
        </h2>
        <button
          type="button"
          onclick={closeModals}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleCreate();
        }}
        class="p-6"
      >
        <div class="space-y-4">
          {#each Object.entries(properties) as [fieldName, fieldDef]}
            {@const isRequired = requiredFields.includes(fieldName)}
            {@const inputType = renderFieldInput(fieldName, fieldDef)}
            <div>
              <label
                for="create-{fieldName}"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {fieldName}
                {#if isRequired}
                  <span class="text-red-600">*</span>
                {/if}
              </label>
              {#if fieldDef.description}
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {fieldDef.description}
                </p>
              {/if}
              {#if inputType === "checkbox"}
                <div class="mt-2">
                  <input
                    type="checkbox"
                    id="create-{fieldName}"
                    bind:checked={formData[fieldName]}
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              {:else}
                <input
                  type={inputType}
                  id="create-{fieldName}"
                  bind:value={formData[fieldName]}
                  placeholder={fieldDef.example ? String(fieldDef.example) : ""}
                  class="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              {/if}
              {#if validationErrors[fieldName]}
                <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors[fieldName]}
                </p>
              {/if}
            </div>
          {/each}
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onclick={closeModals}
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isSubmitting ? "Creating..." : "Create Record"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Edit Modal -->
{#if showEditModal && selectedRecord}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    onclick={(e) => e.target === e.currentTarget && closeModals()}
  >
    <div
      class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white dark:bg-gray-800"
    >
      <div
        class="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Edit Record
        </h2>
        <button
          type="button"
          onclick={closeModals}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleUpdate();
        }}
        class="p-6"
      >
        <div class="space-y-4">
          {#each Object.entries(properties) as [fieldName, fieldDef]}
            {@const isRequired = requiredFields.includes(fieldName)}
            {@const inputType = renderFieldInput(fieldName, fieldDef)}
            <div>
              <label
                for="edit-{fieldName}"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {fieldName}
                {#if isRequired}
                  <span class="text-red-600">*</span>
                {/if}
              </label>
              {#if fieldDef.description}
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {fieldDef.description}
                </p>
              {/if}
              {#if inputType === "checkbox"}
                <div class="mt-2">
                  <input
                    type="checkbox"
                    id="edit-{fieldName}"
                    bind:checked={formData[fieldName]}
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              {:else}
                <input
                  type={inputType}
                  id="edit-{fieldName}"
                  bind:value={formData[fieldName]}
                  placeholder={fieldDef.example ? String(fieldDef.example) : ""}
                  class="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              {/if}
              {#if validationErrors[fieldName]}
                <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors[fieldName]}
                </p>
              {/if}
            </div>
          {/each}
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onclick={closeModals}
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isSubmitting ? "Updating..." : "Update Record"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- View Modal -->
{#if showViewModal && selectedRecord}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    onclick={(e) => e.target === e.currentTarget && closeModals()}
  >
    <div
      class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white dark:bg-gray-800"
    >
      <div
        class="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          View Record
        </h2>
        <button
          type="button"
          onclick={closeModals}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="p-6">
        <dl class="space-y-4">
          {#each Object.entries(properties) as [fieldName, fieldDef]}
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {fieldName}
                {#if requiredFields.includes(fieldName)}
                  <span class="ml-1 text-xs text-red-600">(Required)</span>
                {/if}
              </dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {selectedRecord[fieldName] !== undefined &&
                selectedRecord[fieldName] !== null
                  ? String(selectedRecord[fieldName])
                  : "-"}
              </dd>
            </div>
          {/each}
        </dl>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            onclick={closeModals}
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
