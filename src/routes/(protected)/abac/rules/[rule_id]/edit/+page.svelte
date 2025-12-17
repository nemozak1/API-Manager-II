<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  import PageRoleCheck from "$lib/components/PageRoleCheck.svelte";
  import {
    extractErrorFromResponse,
    formatErrorForDisplay,
    logErrorDetails,
  } from "$lib/utils/errorHandler";
  import {
    Code,
    AlertCircle,
    Info,
    ArrowLeft,
    Copy,
    CheckCircle,
    XCircle,
    Loader2,
  } from "@lucide/svelte";

  let { data }: { data: PageData } = $props();

  // Reference to the textarea for insertion
  let ruleCodeTextarea: HTMLTextAreaElement;

  // Form states matching the actual API structure - pre-populated from loaded data
  let formRuleName = $state(data.rule?.rule_name || "");
  let formRuleCode = $state(data.rule?.rule_code || "");
  let formDescription = $state(data.rule?.description || "");
  let formIsActive = $state(data.rule?.is_active ?? true);
  let formError = $state("");
  let isSubmitting = $state(false);

  // Validation states
  let validationStatus = $state<"idle" | "validating" | "valid" | "invalid">(
    "idle",
  );
  let validationError = $state<string | null>(null);
  let validationDetails = $state<any>(null);
  let validationTimeout: ReturnType<typeof setTimeout> | null = null;
  let copiedValidationError = $state(false);
  let copiedSchemaError = $state(false);

  // Available objects and their fields for ABAC rules - fetched from OBP
  let availableObjects = $state<any[]>([]);
  let schemaLoading = $state(true);
  let schemaError = $state<string | null>(null);

  // Fetch schema from OBP on mount
  async function fetchSchema() {
    schemaLoading = true;
    schemaError = null;
    try {
      const response = await fetch("/api/abac-rules/schema");
      const schema = await response.json();

      if (!response.ok) {
        // Show full error from API
        const errorMsg =
          schema.error || schema.message || "Failed to fetch ABAC schema";
        const fullDetails = schema.fullError
          ? JSON.parse(schema.fullError)
          : schema;
        console.error("ABAC Schema fetch error:", fullDetails);
        throw new Error(
          `${errorMsg}\n\nFull error: ${JSON.stringify(fullDetails, null, 2)}`,
        );
      }

      // Transform OBP schema to our format
      if (schema.objects && Array.isArray(schema.objects)) {
        availableObjects = schema.objects;
      } else {
        // Fallback to hardcoded if schema format is unexpected
        console.warn("Unexpected schema format:", schema);
        availableObjects = defaultObjects;
      }
      schemaLoading = false;
    } catch (err) {
      console.error("Error fetching ABAC schema:", err);
      schemaError = err instanceof Error ? err.message : String(err);
      // Use hardcoded fallback
      availableObjects = defaultObjects;
      schemaLoading = false;
    }
  }

  // Call fetchSchema on mount
  $effect(() => {
    fetchSchema();
  });

  // Fallback hardcoded objects in case API fails
  const defaultObjects = [
    {
      name: "AuthenticatedUser",
      description: "The user making the API call",
      fields: [
        { name: "user_id", type: "String", description: "User ID" },
        { name: "username", type: "String", description: "Username" },
        { name: "emailAddress", type: "String", description: "Email address" },
        { name: "bank_id", type: "String", description: "User's bank ID" },
        { name: "provider", type: "String", description: "Auth provider" },
        { name: "provider_id", type: "String", description: "Provider ID" },
      ],
    },
    {
      name: "OnBehalfOfUser",
      description: "User on whose behalf the action is performed",
      fields: [
        { name: "user_id", type: "String", description: "User ID" },
        { name: "username", type: "String", description: "Username" },
        { name: "emailAddress", type: "String", description: "Email address" },
        { name: "bank_id", type: "String", description: "User's bank ID" },
      ],
    },
    {
      name: "User",
      description: "Generic user object",
      fields: [
        { name: "user_id", type: "String", description: "User ID" },
        { name: "username", type: "String", description: "Username" },
        { name: "emailAddress", type: "String", description: "Email address" },
        { name: "bank_id", type: "String", description: "User's bank ID" },
      ],
    },
    {
      name: "Bank",
      description: "Bank object",
      fields: [
        { name: "bank_id", type: "String", description: "Bank ID" },
        { name: "name", type: "String", description: "Bank name" },
        { name: "full_name", type: "String", description: "Full bank name" },
        { name: "short_name", type: "String", description: "Short bank name" },
      ],
    },
    {
      name: "Account",
      description: "Bank account object",
      fields: [
        { name: "account_id", type: "String", description: "Account ID" },
        { name: "bank_id", type: "String", description: "Bank ID" },
        { name: "owner_id", type: "String", description: "Account owner ID" },
        { name: "type", type: "String", description: "Account type" },
        { name: "label", type: "String", description: "Account label" },
      ],
    },
    {
      name: "View",
      description: "Account view object",
      fields: [
        { name: "view_id", type: "String", description: "View ID" },
        { name: "name", type: "String", description: "View name" },
        {
          name: "description",
          type: "String",
          description: "View description",
        },
        { name: "is_public", type: "Boolean", description: "Is public" },
      ],
    },
    {
      name: "Transaction",
      description: "Transaction object",
      fields: [
        {
          name: "transaction_id",
          type: "String",
          description: "Transaction ID",
        },
        { name: "account_id", type: "String", description: "Account ID" },
        { name: "bank_id", type: "String", description: "Bank ID" },
        { name: "amount", type: "Number", description: "Transaction amount" },
        { name: "type", type: "String", description: "Transaction type" },
      ],
    },
    {
      name: "Customer",
      description: "Customer object",
      fields: [
        { name: "customer_id", type: "String", description: "Customer ID" },
        { name: "bank_id", type: "String", description: "Bank ID" },
        { name: "name", type: "String", description: "Customer name" },
        { name: "emailAddress", type: "String", description: "Email address" },
      ],
    },
    {
      name: "Context",
      description: "Request context",
      fields: [
        { name: "timestamp", type: "Date", description: "Request timestamp" },
        {
          name: "ip_address",
          type: "String",
          description: "Client IP address",
        },
        { name: "method", type: "String", description: "HTTP method" },
        { name: "path", type: "String", description: "Request path" },
      ],
    },
  ];

  let expandedObjects = $state<Set<string>>(new Set());

  function toggleObject(objectName: string) {
    if (expandedObjects.has(objectName)) {
      expandedObjects.delete(objectName);
    } else {
      expandedObjects.add(objectName);
    }
    expandedObjects = new Set(expandedObjects);
  }

  // Debounced validation function
  async function validateRuleCode(code: string) {
    if (!code.trim()) {
      validationStatus = "idle";
      validationError = null;
      return;
    }

    validationStatus = "validating";

    try {
      const response = await fetch("/api/abac-rules/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rule_code: code }),
      });

      const result = await response.json();

      if (result.valid) {
        validationStatus = "valid";
        validationError = null;
        validationDetails = null;
      } else {
        validationStatus = "invalid";
        validationError =
          result.error || result.message || "Rule validation failed";
        validationDetails = result;
      }
    } catch (err) {
      validationStatus = "invalid";
      validationError =
        err instanceof Error ? err.message : "Validation request failed";
      validationDetails = err;
    }
  }

  // Watch for rule code changes and validate with debounce
  $effect(() => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    if (formRuleCode.trim()) {
      validationTimeout = setTimeout(() => {
        validateRuleCode(formRuleCode);
      }, 800); // 800ms debounce
    } else {
      validationStatus = "idle";
      validationError = null;
    }

    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  });

  function insertFieldReference(objectName: string, fieldName: string) {
    const reference = `${objectName}.${fieldName}`;

    if (ruleCodeTextarea) {
      const start = ruleCodeTextarea.selectionStart;
      const end = ruleCodeTextarea.selectionEnd;
      const text = formRuleCode;

      formRuleCode = text.substring(0, start) + reference + text.substring(end);

      // Set cursor position after inserted text
      setTimeout(() => {
        if (ruleCodeTextarea) {
          const newPosition = start + reference.length;
          ruleCodeTextarea.selectionStart = newPosition;
          ruleCodeTextarea.selectionEnd = newPosition;
          ruleCodeTextarea.focus();
        }
      }, 0);
    }
  }

  // Example rule codes for guidance
  const exampleRuleCodes = [
    {
      title: "Admin Only",
      code: 'user.emailAddress.contains("admin")',
      description: "Only allow users with admin in their email",
    },
    {
      title: "Owner Access",
      code: "user.user_id == account.owner_id",
      description: "Only allow account owners to access",
    },
    {
      title: "Role Based",
      code: 'user.hasRole("CanAccessAllAccounts")',
      description: "Check if user has specific role",
    },
    {
      title: "Bank Restriction",
      code: "user.bank_id == resource.bank_id",
      description: "Restrict to same bank as resource",
    },
  ];

  let showExamples = $state(false);

  function insertExample(code: string) {
    formRuleCode = code;
    showExamples = false;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!formRuleName.trim()) {
      formError = "Rule name is required";
      return;
    }

    if (!formRuleCode.trim()) {
      formError = "Rule code is required";
      return;
    }

    isSubmitting = true;
    formError = "";

    try {
      const requestBody: any = {
        rule_name: formRuleName,
        rule_code: formRuleCode,
        is_active: formIsActive,
      };

      if (formDescription.trim()) {
        requestBody.description = formDescription;
      }

      const response = await fetch(`/api/abac-rules/${data.ruleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorDetails = await extractErrorFromResponse(
          response,
          "Failed to update ABAC rule",
        );
        logErrorDetails("Update ABAC Rule", errorDetails);
        const errorMessage = formatErrorForDisplay(errorDetails);

        throw new Error(errorMessage);
      }

      // Success - redirect back to the rules list
      goto("/abac/rules");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update ABAC rule";
      formError = errorMsg;
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto("/abac/rules");
  }
</script>

<svelte:head>
  <title>Edit ABAC Rule - API Manager II</title>
</svelte:head>

<PageRoleCheck
  userEntitlements={data.userEntitlements}
  requiredRoles={data.requiredRoles}
>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-6">
      <button
        onclick={handleCancel}
        class="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <ArrowLeft size={16} />
        Back to Rules
      </button>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Edit ABAC Rule
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Update the Attribute-Based Access Control rule
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Object Browser Sidebar -->
      <div class="lg:col-span-1">
        <div
          class="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 sticky top-4"
        >
          <h3
            class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3"
          >
            Available Objects
          </h3>
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Click fields to insert into rule code
          </p>

          {#if schemaLoading}
            <div class="flex items-center justify-center py-8">
              <Loader2 class="animate-spin text-blue-500" size={24} />
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400"
                >Loading schema...</span
              >
            </div>
          {:else if schemaError}
            <div
              class="rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/20"
            >
              <div class="flex items-start justify-between mb-2">
                <p class="text-xs text-red-800 dark:text-red-200 font-semibold">
                  Schema Fetch Error
                </p>
                <button
                  type="button"
                  onclick={async () => {
                    const errorText = schemaError || "Schema fetch error";
                    await navigator.clipboard.writeText(errorText);
                    copiedSchemaError = true;
                    setTimeout(() => {
                      copiedSchemaError = false;
                    }, 2000);
                  }}
                  class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  title="Copy error to clipboard"
                >
                  {#if copiedSchemaError}
                    <CheckCircle size={14} class="text-green-600" />
                  {:else}
                    <Copy size={14} />
                  {/if}
                </button>
              </div>
              <p class="text-xs text-red-700 dark:text-red-300 mb-2">
                {schemaError}
              </p>
              <details class="text-xs">
                <summary
                  class="cursor-pointer text-red-600 dark:text-red-400 hover:underline"
                >
                  Show full error details
                </summary>
                <div class="mt-2">
                  <p class="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                    Using fallback schema
                  </p>
                  <button
                    type="button"
                    onclick={() => fetchSchema()}
                    class="mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 rounded border border-red-300 dark:border-red-700"
                  >
                    Retry fetch schema
                  </button>
                </div>
              </details>
            </div>
          {/if}

          <div class="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {#each availableObjects as obj}
              <div class="border border-gray-200 dark:border-gray-700 rounded">
                <button
                  type="button"
                  onclick={() => toggleObject(obj.name)}
                  class="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                >
                  <div>
                    <div class="font-mono text-blue-600 dark:text-blue-400">
                      {obj.name}
                    </div>
                    <div
                      class="text-gray-500 dark:text-gray-400 text-xs mt-0.5"
                    >
                      {obj.description}
                    </div>
                  </div>
                  <span class="text-gray-400"
                    >{expandedObjects.has(obj.name) ? "−" : "+"}</span
                  >
                </button>

                {#if expandedObjects.has(obj.name)}
                  <div
                    class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  >
                    {#each obj.fields as field}
                      <button
                        type="button"
                        onclick={() =>
                          insertFieldReference(obj.name, field.name)}
                        class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <div class="flex items-start gap-2">
                          <Copy
                            size={12}
                            class="text-gray-400 mt-0.5 flex-shrink-0"
                          />
                          <div class="flex-1 min-w-0">
                            <div
                              class="font-mono text-xs text-gray-900 dark:text-gray-100"
                            >
                              {field.name}
                            </div>
                            <div
                              class="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                            >
                              {field.description}
                            </div>
                            <div
                              class="text-xs text-gray-400 dark:text-gray-500 mt-0.5"
                            >
                              {field.type}
                            </div>
                          </div>
                        </div>
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Main Form -->
      <div class="lg:col-span-2">
        <div
          class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 dark:shadow-gray-900/50"
        >
          {#if formError}
            <div
              class="mb-4 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
            >
              <AlertCircle
                class="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400"
                size={20}
              />
              <p class="text-sm text-red-800 dark:text-red-200">{formError}</p>
            </div>
          {/if}

          <!-- Info Banner -->
          <div
            class="mb-6 flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
          >
            <Info
              class="mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400"
              size={20}
            />
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <p class="font-medium">About ABAC Rules</p>
              <p class="mt-1">
                ABAC rules use code expressions to define access control logic.
                You can reference user attributes, resource properties, and use
                logical operators to create flexible authorization rules.
              </p>
            </div>
          </div>

          <form onsubmit={handleSubmit}>
            <div class="space-y-6">
              <!-- Rule Name Field -->
              <div>
                <label
                  for="rule_name"
                  class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Rule Name <span class="text-red-600">*</span>
                </label>
                <input
                  id="rule_name"
                  type="text"
                  bind:value={formRuleName}
                  required
                  placeholder="e.g., admin_only"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
                />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  A unique identifier for this rule
                </p>
              </div>

              <!-- Rule Code Field -->
              <div>
                <div class="mb-2 flex items-center justify-between">
                  <label
                    for="rule_code"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Rule Code <span class="text-red-600">*</span>
                  </label>
                  <button
                    type="button"
                    onclick={() => (showExamples = !showExamples)}
                    class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {showExamples ? "Hide" : "Show"} Examples
                  </button>
                </div>

                {#if showExamples}
                  <div
                    class="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <p
                      class="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Example Rule Codes:
                    </p>
                    <div class="space-y-2">
                      {#each exampleRuleCodes as example}
                        <div
                          class="rounded border border-gray-200 bg-white p-2 dark:border-gray-600 dark:bg-gray-800"
                        >
                          <div class="mb-1 flex items-center justify-between">
                            <span
                              class="text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                              {example.title}
                            </span>
                            <button
                              type="button"
                              onclick={() => insertExample(example.code)}
                              class="text-xs text-blue-600 hover:underline dark:text-blue-400"
                            >
                              Use this
                            </button>
                          </div>
                          <code
                            class="block text-xs text-gray-600 dark:text-gray-400"
                          >
                            {example.code}
                          </code>
                          <p
                            class="mt-1 text-xs text-gray-500 dark:text-gray-500"
                          >
                            {example.description}
                          </p>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                <div class="relative">
                  <Code class="absolute left-3 top-3 text-gray-400" size={18} />
                  <textarea
                    id="rule_code"
                    bind:this={ruleCodeTextarea}
                    bind:value={formRuleCode}
                    required
                    rows="6"
                    placeholder="e.g., AuthenticatedUser.emailAddress.contains('admin')"
                    class="w-full rounded-lg border {validationStatus ===
                    'invalid'
                      ? 'border-red-500'
                      : validationStatus === 'valid'
                        ? 'border-green-500'
                        : 'border-gray-300'} bg-white py-2 pl-10 pr-10 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
                  ></textarea>

                  <!-- Validation Status Icon -->
                  <div class="absolute right-3 top-3">
                    {#if validationStatus === "validating"}
                      <Loader2 class="animate-spin text-blue-500" size={18} />
                    {:else if validationStatus === "valid"}
                      <CheckCircle class="text-green-500" size={18} />
                    {:else if validationStatus === "invalid"}
                      <XCircle class="text-red-500" size={18} />
                    {/if}
                  </div>
                </div>

                <!-- Validation Messages -->
                {#if validationStatus === "valid"}
                  <p
                    class="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1"
                  >
                    <CheckCircle size={12} />
                    Rule code is valid
                  </p>
                {:else if validationStatus === "invalid" && validationError}
                  <div
                    class="mt-2 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/20"
                  >
                    <div class="flex items-start justify-between mb-2">
                      <p
                        class="text-xs text-red-600 dark:text-red-400 flex items-start gap-1 font-semibold"
                      >
                        <XCircle size={14} class="mt-0.5 shrink-0" />
                        <span>Validation Error</span>
                      </p>
                      <button
                        type="button"
                        onclick={async () => {
                          const errorText = validationDetails
                            ? JSON.stringify(validationDetails, null, 2)
                            : validationError || "Validation error";
                          await navigator.clipboard.writeText(errorText);
                          copiedValidationError = true;
                          setTimeout(() => {
                            copiedValidationError = false;
                          }, 2000);
                        }}
                        class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 relative"
                        title="Copy error to clipboard"
                      >
                        {#if copiedValidationError}
                          <CheckCircle size={14} class="text-green-600" />
                        {:else}
                          <Copy size={14} />
                        {/if}
                      </button>
                    </div>
                    <div class="ml-5 space-y-2">
                      <p class="text-xs text-red-700 dark:text-red-300">
                        {validationError}
                      </p>
                      {#if validationDetails}
                        <details class="text-xs">
                          <summary
                            class="cursor-pointer text-red-600 dark:text-red-400 hover:underline"
                          >
                            Show full error details
                          </summary>
                          <pre
                            class="mt-2 overflow-x-auto rounded bg-red-100 dark:bg-red-950 p-2 text-xs text-red-900 dark:text-red-200">{JSON.stringify(
                              validationDetails,
                              null,
                              2,
                            )}</pre>
                        </details>
                      {/if}
                    </div>
                  </div>
                {:else if validationStatus === "validating"}
                  <p
                    class="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1"
                  >
                    <Loader2 size={12} class="animate-spin" />
                    Validating rule...
                  </p>
                {:else}
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Click fields from the sidebar to insert references, or type
                    your own expression
                  </p>
                {/if}
              </div>

              <!-- Description Field -->
              <div>
                <label
                  for="description"
                  class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  bind:value={formDescription}
                  rows="3"
                  placeholder="Only allow access to users with admin email"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
                ></textarea>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  A human-readable description of what this rule does
                </p>
              </div>

              <!-- Is Active Checkbox -->
              <div
                class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
              >
                <label class="flex items-start">
                  <input
                    type="checkbox"
                    bind:checked={formIsActive}
                    class="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <div class="ml-3">
                    <span
                      class="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Rule is Active
                    </span>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      When active, this rule will be evaluated for access
                      control decisions. Inactive rules are ignored but remain
                      in the system.
                    </p>
                  </div>
                </label>
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
                    Updating...
                  </span>
                {:else}
                  Update ABAC Rule
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</PageRoleCheck>
