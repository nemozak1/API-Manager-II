<script lang="ts">
  import type { OBPWebUIProp } from "$lib/obp/types";
  import {
    extractErrorFromResponse,
    formatErrorForDisplay,
    logErrorDetails,
  } from "$lib/utils/errorHandler";

  let { data } = $props();
  const webuiProps: OBPWebUIProp[] = data.webuiProps;
  const currentWhat = data.whatParam || "active";

  let searchQuery = $state("");
  let showCreateModal = $state(false);
  let showEditModal = $state(false);
  let showDeleteModal = $state(false);
  let selectedProp: OBPWebUIProp | null = $state(null);

  // Form fields
  let formName = $state("");
  let formValue = $state("");
  let formDescription = $state("");
  let formIsActive = $state(true);
  let isSubmitting = $state(false);

  $effect(() => {
    if (showCreateModal) {
      formName = "";
      formValue = "";
      formDescription = "";
      formIsActive = true;
    } else if (showEditModal && selectedProp) {
      formName = selectedProp.name;
      formValue = selectedProp.value;
      formDescription = selectedProp.description;
      formIsActive = selectedProp.is_active;
    }
  });

  const filteredProps = $derived(
    webuiProps.filter((prop) => {
      // Filter by search query
      if (searchQuery === "") return true;

      const query = searchQuery.toLowerCase();
      return (
        prop.name.toLowerCase().includes(query) ||
        prop.value.toLowerCase().includes(query) ||
        prop.description.toLowerCase().includes(query) ||
        prop.webui_props_id.toLowerCase().includes(query)
      );
    }),
  );

  function openCreateModal() {
    showCreateModal = true;
  }

  function closeCreateModal() {
    showCreateModal = false;
    formName = "";
    formValue = "";
    formDescription = "";
    formIsActive = true;
  }

  function openEditModal(prop: OBPWebUIProp) {
    selectedProp = prop;
    showEditModal = true;
  }

  function closeEditModal() {
    showEditModal = false;
    selectedProp = null;
  }

  function openDeleteModal(prop: OBPWebUIProp) {
    selectedProp = prop;
    showDeleteModal = true;
  }

  function closeDeleteModal() {
    showDeleteModal = false;
    selectedProp = null;
  }

  async function handleCreate() {
    console.log("=== handleCreate called ===");
    if (!formName || !formValue) {
      alert("Name and value are required");
      return;
    }

    isSubmitting = true;

    try {
      const requestData = {
        name: formName,
        value: formValue,
        description: formDescription,
        is_active: formIsActive,
      };
      console.log("Sending request to create webui prop:", requestData);

      const response = await fetch("/api/webui-props", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorDetails = await extractErrorFromResponse(
          response,
          "Failed to create webui prop",
        );
        console.error("Error details from response:", errorDetails);
        logErrorDetails("Create WebUI Prop", errorDetails);
        const errorMessage = formatErrorForDisplay(errorDetails);
        console.error("Formatted error message:", errorMessage);
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log("Success! Response data:", responseData);

      alert("WebUI prop created successfully");
      closeCreateModal();
      window.location.reload();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create webui prop";
      console.error("=== Create error ===");
      console.error("Error message:", errorMsg);
      console.error("Full error:", error);
      alert(`Error: ${errorMsg}`);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleUpdate() {
    if (!selectedProp) return;

    if (!formName || !formValue) {
      alert("Name and value are required");
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch(
        `/api/webui-props/${selectedProp.webui_props_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formName,
            value: formValue,
            description: formDescription,
            is_active: formIsActive,
          }),
        },
      );

      if (!response.ok) {
        const errorDetails = await extractErrorFromResponse(
          response,
          "Failed to update webui prop",
        );
        logErrorDetails("Update WebUI Prop", errorDetails);
        const errorMessage = formatErrorForDisplay(errorDetails);
        throw new Error(errorMessage);
      }

      alert("WebUI prop updated successfully");
      closeEditModal();
      window.location.reload();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to update webui prop";
      alert(`Error: ${errorMsg}`);
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
          "Failed to delete webui prop",
        );
        logErrorDetails("Delete WebUI Prop", errorDetails);
        const errorMessage = formatErrorForDisplay(errorDetails);
        throw new Error(errorMessage);
      }

      alert("WebUI prop deleted successfully");
      closeDeleteModal();
      window.location.reload();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to delete webui prop";
      alert(`Error: ${errorMsg}`);
      console.error("Delete error:", error);
    } finally {
      isSubmitting = false;
    }
  }

  function formatValue(value: string): string {
    if (value.length > 100) {
      return value.substring(0, 100) + "...";
    }
    return value;
  }
</script>

<h1 class="text-gray-900 dark:text-gray-100">WebUI Props</h1>

<p class="mb-4 text-gray-700 dark:text-gray-300">
  Manage WebUI properties used for configuration and content throughout the
  application.
</p>

<!-- Source Selection Buttons -->
<div class="mb-6">
  <div class="flex items-center gap-4">
    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
      Data Source:
    </span>
    <div class="flex gap-2">
      <a
        href="/system/webui-props?what=active"
        class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {currentWhat ===
        'active'
          ? 'bg-blue-600 text-white dark:bg-blue-500'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
      >
        Active
      </a>
      <a
        href="/system/webui-props?what=database"
        class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {currentWhat ===
        'database'
          ? 'bg-blue-600 text-white dark:bg-blue-500'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
      >
        Database
      </a>
      <a
        href="/system/webui-props?what=config"
        class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {currentWhat ===
        'config'
          ? 'bg-blue-600 text-white dark:bg-blue-500'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
      >
        Config
      </a>
    </div>
  </div>
  <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
    <strong>Active:</strong> Props marked as active |
    <strong>Database:</strong> All props from database |
    <strong>Config:</strong> Props from configuration files
  </p>
</div>

<!-- Info Notice -->
<div
  class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
>
  <div class="flex items-start">
    <svg
      class="mr-3 mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fill-rule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clip-rule="evenodd"
      />
    </svg>
    <div>
      <h3 class="text-sm font-medium text-blue-900 dark:text-blue-100">
        About WebUI Props
      </h3>
      <p class="mt-1 text-sm text-blue-800 dark:text-blue-200">
        WebUI props are key-value pairs used to configure various aspects of the
        web interface, such as legal documents, feature flags, and other
        settings. Changes take effect immediately.
      </p>
    </div>
  </div>
</div>

<!-- Search and Create Button -->
<div
  class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
>
  <div class="flex-1">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search by name, value, description, or ID..."
      class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
    />
  </div>
  <button
    type="button"
    onclick={openCreateModal}
    class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
  >
    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 4v16m8-8H4"
      />
    </svg>
    Create New Prop
  </button>
</div>

<!-- Props List -->
{#if filteredProps && filteredProps.length > 0}
  <div class="space-y-4">
    {#each filteredProps as prop (prop.webui_props_id)}
      <div
        class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <!-- Header with Name and Status -->
        <div class="mb-4 flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h2
                class="text-xl font-semibold text-gray-900 dark:text-gray-100"
              >
                {prop.name}
              </h2>
              <span
                class="rounded-full px-3 py-1 text-xs font-medium {prop.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}"
              >
                {prop.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            {#if prop.description}
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {prop.description}
              </p>
            {/if}
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              onclick={() => openEditModal(prop)}
              class="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
            >
              Edit
            </button>
            <button
              type="button"
              onclick={() => openDeleteModal(prop)}
              class="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Content Section -->
        <div class="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
          <div>
            <div
              class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              WebUI Props ID
            </div>
            <code
              class="block rounded bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            >
              {prop.webui_props_id}
            </code>
          </div>

          <div>
            <div
              class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              Value
            </div>
            <div
              class="block rounded bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            >
              <pre
                class="whitespace-pre-wrap break-all font-mono text-xs">{prop.value}</pre>
            </div>
          </div>
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
      No webui props match your search criteria. Try a different search term.
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
      No WebUI props found
    </p>
    <p class="mb-4 text-gray-600 dark:text-gray-400">
      No webui props exist yet in the system. Click "Create New Prop" to add
      your first property.
    </p>
    <p class="text-sm text-gray-500 dark:text-gray-500">
      <strong>Note:</strong> If you expected to see properties here, check your permissions
      or the browser console for errors.
    </p>
  </div>
{/if}

<!-- Create Modal -->
{#if showCreateModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="create-modal-title"
    onclick={(e) => {
      if (e.target === e.currentTarget) closeCreateModal();
    }}
    onkeydown={(e) => {
      if (e.key === "Escape") closeCreateModal();
    }}
  >
    <div
      class="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      onclick={(e) => e.stopPropagation()}
    >
      <h2
        id="create-modal-title"
        class="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100"
      >
        Create New WebUI Prop
      </h2>

      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleCreate();
        }}
        class="space-y-4"
      >
        <div>
          <label
            for="name"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Name <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            bind:value={formName}
            required
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            placeholder="e.g., webui_feature_flag_example"
          />
        </div>

        <div>
          <label
            for="value"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Value <span class="text-red-500">*</span>
          </label>
          <textarea
            id="value"
            bind:value={formValue}
            required
            rows="6"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            placeholder="Enter the value..."
          ></textarea>
        </div>

        <div>
          <label
            for="description"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <input
            type="text"
            id="description"
            bind:value={formDescription}
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            placeholder="Brief description of this property"
          />
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            bind:checked={formIsActive}
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <label
            for="is_active"
            class="ml-2 text-sm text-gray-700 dark:text-gray-300"
          >
            Active
          </label>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onclick={closeCreateModal}
            disabled={isSubmitting}
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Edit Modal -->
{#if showEditModal && selectedProp}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="edit-modal-title"
    onclick={(e) => {
      if (e.target === e.currentTarget) closeEditModal();
    }}
    onkeydown={(e) => {
      if (e.key === "Escape") closeEditModal();
    }}
  >
    <div
      class="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      onclick={(e) => e.stopPropagation()}
    >
      <h2
        id="edit-modal-title"
        class="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100"
      >
        Edit WebUI Prop
      </h2>

      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleUpdate();
        }}
        class="space-y-4"
      >
        <div>
          <label
            for="edit-name"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Name <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="edit-name"
            bind:value={formName}
            required
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <div>
          <label
            for="edit-value"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Value <span class="text-red-500">*</span>
          </label>
          <textarea
            id="edit-value"
            bind:value={formValue}
            required
            rows="6"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          ></textarea>
        </div>

        <div>
          <label
            for="edit-description"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <input
            type="text"
            id="edit-description"
            bind:value={formDescription}
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="edit-is_active"
            bind:checked={formIsActive}
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <label
            for="edit-is_active"
            class="ml-2 text-sm text-gray-700 dark:text-gray-300"
          >
            Active
          </label>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onclick={closeEditModal}
            disabled={isSubmitting}
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isSubmitting ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && selectedProp}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-modal-title"
    onclick={(e) => {
      if (e.target === e.currentTarget) closeDeleteModal();
    }}
    onkeydown={(e) => {
      if (e.key === "Escape") closeDeleteModal();
    }}
  >
    <div
      class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="mb-4">
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
        >
          <svg
            class="h-6 w-6 text-red-600 dark:text-red-400"
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
        </div>
      </div>

      <h2
        id="delete-modal-title"
        class="mb-2 text-center text-xl font-bold text-gray-900 dark:text-gray-100"
      >
        Delete WebUI Prop
      </h2>
      <p class="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Are you sure you want to delete the property <strong
          class="font-semibold">{selectedProp.name}</strong
        >? This action cannot be undone.
      </p>

      <div class="flex justify-center gap-3">
        <button
          type="button"
          onclick={closeDeleteModal}
          disabled={isSubmitting}
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleDelete}
          disabled={isSubmitting}
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
        >
          {isSubmitting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  </div>
{/if}
