<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  import PageRoleCheck from "$lib/components/PageRoleCheck.svelte";
  import {
    extractErrorFromResponse,
    formatErrorForDisplay,
    logErrorDetails,
  } from "$lib/utils/errorHandler";

  let { data }: { data: PageData } = $props();

  // Form states
  let formName = $state("");
  let formDescription = $state("");
  let formIsPublic = $state(false);
  let formError = $state("");
  let isSubmitting = $state(false);

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!formName.trim()) {
      formError = "View name is required";
      return;
    }

    if (!formDescription.trim()) {
      formError = "Description is required";
      return;
    }

    isSubmitting = true;
    formError = "";

    try {
      const response = await fetch("/api/system-views", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          is_public: formIsPublic,
        }),
      });

      if (!response.ok) {
        const errorDetails = await extractErrorFromResponse(
          response,
          "Failed to create system view",
        );
        logErrorDetails("Create System View", errorDetails);
        const errorMessage = formatErrorForDisplay(errorDetails);

        throw new Error(errorMessage);
      }

      // Success - redirect back to the system views list
      goto("/account-access/system-views");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create system view";
      formError = errorMsg;
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto("/account-access/system-views");
  }
</script>

<svelte:head>
  <title>Create System View - API Manager II</title>
</svelte:head>

<PageRoleCheck
  userEntitlements={data.userEntitlements}
  requiredRoles={data.requiredRoles}
>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Create System View
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Create a new system view to control account data visibility
      </p>
    </div>

    <div class="mx-auto max-w-2xl">
      <div
        class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 dark:shadow-gray-900/50"
      >
        {#if formError}
          <div
            class="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
          >
            <p class="text-sm text-red-800 dark:text-red-200">{formError}</p>
          </div>
        {/if}

        <form onsubmit={handleSubmit}>
          <div class="space-y-6">
            <!-- Name Field -->
            <div>
              <label
                for="name"
                class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                View Name <span class="text-red-600">*</span>
              </label>
              <input
                id="name"
                type="text"
                bind:value={formName}
                required
                placeholder="e.g., owner"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                A unique identifier for the system view
              </p>
            </div>

            <!-- Description Field -->
            <div>
              <label
                for="description"
                class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description <span class="text-red-600">*</span>
              </label>
              <textarea
                id="description"
                bind:value={formDescription}
                required
                rows="4"
                placeholder="Describe the purpose and scope of this view"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
              ></textarea>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Explain what data this view provides access to
              </p>
            </div>

            <!-- Is Public Checkbox -->
            <div>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={formIsPublic}
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span
                  class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Public View
                </span>
              </label>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                If checked, this view will be accessible to all users
              </p>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onclick={handleCancel}
              disabled={isSubmitting}
              class="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {#if isSubmitting}
                <span class="flex items-center">
                  <svg
                    class="mr-2 h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </span>
              {:else}
                Create System View
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</PageRoleCheck>
