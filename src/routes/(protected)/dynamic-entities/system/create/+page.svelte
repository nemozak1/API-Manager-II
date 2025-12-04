<script lang="ts">
  import { goto } from "$app/navigation";

  let entityName = $state("");
  let entityDescription = $state("");
  let schemaJson = $state(`{
  "properties": {
    "name": {
      "type": "string",
      "description": "Name field",
      "example": "Example Name"
    },
    "age": {
      "type": "integer",
      "description": "Age in years",
      "minimum": 0,
      "maximum": 150
    },
    "active": {
      "type": "boolean",
      "description": "Is active",
      "example": true
    }
  },
  "required": ["name"]
}`);
  let isSubmitting = $state(false);
  let schemaError = $state("");

  function validateSchema(): boolean {
    try {
      const parsed = JSON.parse(schemaJson);
      if (!parsed.properties || typeof parsed.properties !== "object") {
        schemaError = "Schema must have a 'properties' object";
        return false;
      }
      schemaError = "";
      return true;
    } catch (e) {
      schemaError = e instanceof Error ? e.message : "Invalid JSON";
      return false;
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!entityName.trim()) {
      alert("Entity name is required");
      return;
    }

    if (!validateSchema()) {
      alert("Please fix the schema errors");
      return;
    }

    isSubmitting = true;

    try {
      const schema = JSON.parse(schemaJson);

      // Construct the system dynamic entity payload
      const payload: Record<string, any> = {};
      payload[entityName] = {
        description: entityDescription || `${entityName} entity`,
        required: schema.required || [],
        properties: schema.properties,
      };

      const response = await fetch(`/api/dynamic-entities/system/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Failed to create entity");
      }

      alert("System dynamic entity created successfully");
      goto("/dynamic-entities/system");
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to create entity",
      );
      console.error("Create error:", error);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Create System Dynamic Entity - API Manager</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
  <!-- Header -->
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
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
      Create System Dynamic Entity
    </h1>
    <p class="mt-1 text-gray-600 dark:text-gray-400">
      Define a new system dynamic entity schema
    </p>
  </div>

  <!-- Form -->
  <div
    class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <form onsubmit={handleSubmit} class="space-y-6">
      <!-- Entity Name -->
      <div>
        <label
          for="entityName"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Entity Name <span class="text-red-600">*</span>
        </label>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          The name of your entity (e.g., Piano, Guitar, Customer)
        </p>
        <input
          type="text"
          id="entityName"
          bind:value={entityName}
          required
          placeholder="e.g., Piano"
          class="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      <!-- Description -->
      <div>
        <label
          for="description"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description
        </label>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          A brief description of this entity
        </p>
        <input
          type="text"
          id="description"
          bind:value={entityDescription}
          placeholder="e.g., Musical instrument entity"
          class="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      <!-- Schema JSON -->
      <div>
        <label
          for="schema"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Schema (JSON) <span class="text-red-600">*</span>
        </label>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Define the properties of your entity in JSON format
        </p>
        <textarea
          id="schema"
          bind:value={schemaJson}
          oninput={() => validateSchema()}
          rows="15"
          class="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        ></textarea>
        {#if schemaError}
          <p class="mt-2 text-sm text-red-600 dark:text-red-400">
            {schemaError}
          </p>
        {/if}
      </div>

      <!-- Help Text -->
      <div
        class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
      >
        <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-100">
          Schema Format Guide
        </h3>
        <ul
          class="mt-2 space-y-1 text-xs text-blue-800 dark:text-blue-200"
        >
          <li>
            <strong>properties:</strong> Define fields with type, description, and
            validation rules
          </li>
          <li>
            <strong>type:</strong> Can be "string", "number", "integer", "boolean",
            "DATE_WITH_DAY"
          </li>
          <li>
            <strong>required:</strong> Array of required field names (optional)
          </li>
          <li>
            <strong>minimum/maximum:</strong> For numeric validation (optional)
          </li>
          <li>
            <strong>minLength/maxLength:</strong> For string validation (optional)
          </li>
          <li>
            <strong>example:</strong> Example value for the field (optional)
          </li>
        </ul>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 border-t pt-4 dark:border-gray-700">
        <a
          href="/dynamic-entities/system"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isSubmitting}
          class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {#if isSubmitting}
            Creating...
          {:else}
            Create Entity
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>
