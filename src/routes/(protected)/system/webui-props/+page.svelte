<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import type { PageData } from "./$types";
  import type { OBPWebUIProp } from "$lib/obp/types";
  import {
    extractErrorFromResponse,
    formatErrorForDisplay,
    logErrorDetails,
  } from "$lib/utils/errorHandler";

  let { data }: { data: PageData } = $props();

  let searchQuery = $state("");
  let currentFilter = $state(data.filter || "active");

  // Modal states
  let showEditModal = $state(false);
  let showDeleteModal = $state(false);
  let selectedProp: OBPWebUIProp | null = $state(null);

  // Form states (for edit/delete only)
  let formName = $state("");
  let formValue = $state("");
  let formError = $state("");
  let isSubmitting = $state(false);

  // Filter props based on search query
  const filteredProps = $derived(
    (data.props || []).filter((prop: OBPWebUIProp) => {
      if (searchQuery === "") return true;

      const query = searchQuery.toLowerCase();
      const name = (prop.name || "").toLowerCase();
      const value = (prop.value || "").toLowerCase();

      return name.includes(query) || value.includes(query);
    }),
  );

  function openCreateModal() {
    goto("/system/webui-props/create");
  }

  function openEditModal(prop: OBPWebUIProp) {
    selectedProp = prop;
    formName = prop.name;
    formValue = prop.value;
    formError = "";
    showEditModal = true;
  }

  function openDeleteModal(prop: OBPWebUIProp) {
    selectedProp = prop;
    showDeleteModal = true;
  }

  function closeModals() {
    showEditModal = false;
    showDeleteModal = false;
    selectedProp = null;
    formError = "";
    isSubmitting = false;
  }

  async function handleEdit() {
    if (!selectedProp || !formName.trim() || !formValue.trim()) {
      formError = "Name and value are required";
      return;
    }

    isSubmitting = true;
    formError = "";

    try {
      const response = await fetch(
        `/api/webui-props/${selectedProp.webui_props_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formName.trim(),
            value: formValue,
          }),
        },
      );

      if (!response.ok) {
        const errorDetails = await extractErrorFromResponse(
          response,
          "Failed to update prop",
        );
        logErrorDetails("Update WebUI Prop", errorDetails);
        const errorMessage = formatErrorForDisplay(errorDetails);
        throw new Error(errorMessage);
      }

      closeModals();
      window.location.reload();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to update prop";
      formError = errorMsg;
      console.error("Update error:", error);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDelete() {
    if (!selectedProp) return;

    isSubmitting = true;

    try {
      const response = await fetch(
        `/api/webui-props/${selectedProp.webui_props_id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorDetails = await extractErrorFromResponse(
          response,
          "Failed to delete prop",
        );
        logErrorDetails("Delete WebUI Prop", errorDetails);
        const errorMessage = formatErrorForDisplay(errorDetails);
        throw new Error(errorMessage);
      }

      closeModals();
      window.location.reload();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to delete prop";
      alert(`Error: ${errorMsg}`);
      console.error("Delete error:", error);
    } finally {
      isSubmitting = false;
    }
  }

  async function switchFilter(filter: string) {
    currentFilter = filter;
    await goto(`/system/webui-props?what=${filter}`, { invalidateAll: true });
  }
</script>

<div class="mb-6">
  <div class="mb-4 flex items-center justify-between">
    <div>
      <h1 class="text-gray-900 dark:text-gray-100">WebUI Props</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Manage configuration properties for the web interface ({filteredProps.length}
        props)
      </p>
    </div>
    <button
      onclick={openCreateModal}
      class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
    >
      Create New Prop
    </button>
  </div>

  <!-- Filter Buttons -->
  <div class="mb-4 flex gap-2">
    <button
      onclick={() => switchFilter("active")}
      class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {currentFilter ===
      'active'
        ? 'bg-blue-600 text-white dark:bg-blue-500'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
    >
      Active
    </button>
    <button
      onclick={() => switchFilter("database")}
      class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {currentFilter ===
      'database'
        ? 'bg-blue-600 text-white dark:bg-blue-500'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
    >
      Database
    </button>
    <button
      onclick={() => switchFilter("config")}
      class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {currentFilter ===
      'config'
        ? 'bg-blue-600 text-white dark:bg-blue-500'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
    >
      Config
    </button>
  </div>

  <!-- Search Box -->
  <div class="mb-4">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search by name, value, or description..."
      class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
    />
  </div>
</div>

<!-- Props List -->
{#if filteredProps && filteredProps.length > 0}
  <div class="space-y-4">
    {#each filteredProps as prop, index (prop.webui_props_id || `prop-${index}`)}
      <div
        class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <!-- Header with Name -->
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {prop.name}
          </h2>
        </div>

        <!-- Value -->
        <div class="mb-4">
          <div
            class="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            Value
          </div>
          <pre
            class="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 text-sm text-gray-900 dark:bg-gray-900/50 dark:text-gray-100">{prop.value}</pre>
        </div>

        <!-- Action Buttons - Only show for database source -->
        {#if prop.source === "database"}
          <div class="flex gap-2">
            <button
              onclick={() => openEditModal(prop)}
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Edit
            </button>
            <button
              onclick={() => openDeleteModal(prop)}
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        {/if}
      </div>
    {/each}
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
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
    <p class="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
      No props found
    </p>
    <p class="text-gray-600 dark:text-gray-400">
      {searchQuery
        ? "Try adjusting your search query"
        : "Create your first prop to get started"}
    </p>
  </div>
{/if}

<!-- Create Modal -->
<!-- Edit Modal -->
{#if showEditModal && selectedProp}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="edit-modal-title"
    onclick={closeModals}
    onkeydown={(e) => e.key === "Escape" && closeModals()}
  >
    <div
      class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      role="document"
      onclick={(e) => e.stopPropagation()}
    >
      <h2
        id="edit-modal-title"
        class="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100"
      >
        Edit Prop
      </h2>

      {#if formError}
        <div
          class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
        >
          <p class="text-sm text-red-800 dark:text-red-200">{formError}</p>
        </div>
      {/if}

      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleEdit();
        }}
      >
        <div class="space-y-4">
          <!-- Name -->
          <div>
            <label
              for="edit-name"
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Name <span class="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="edit-name"
              bind:value={formName}
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <!-- Value -->
          <div>
            <label
              for="edit-value"
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Value <span class="text-red-600">*</span>
            </label>
            <textarea
              id="edit-value"
              bind:value={formValue}
              rows="6"
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            ></textarea>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onclick={closeModals}
            disabled={isSubmitting}
            class="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isSubmitting ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Delete Modal -->
{#if showDeleteModal && selectedProp}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-modal-title"
    onclick={closeModals}
    onkeydown={(e) => e.key === "Escape" && closeModals()}
  >
    <div
      class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      role="document"
      onclick={(e) => e.stopPropagation()}
    >
      <h2
        id="delete-modal-title"
        class="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100"
      >
        Delete Prop
      </h2>

      <p class="mb-6 text-gray-700 dark:text-gray-300">
        Are you sure you want to delete the prop <strong class="font-semibold"
          >{selectedProp.name}</strong
        >? This action cannot be undone.
      </p>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-2">
        <button
          type="button"
          onclick={closeModals}
          disabled={isSubmitting}
          class="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleDelete}
          disabled={isSubmitting}
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
        >
          {isSubmitting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  </div>
{/if}
