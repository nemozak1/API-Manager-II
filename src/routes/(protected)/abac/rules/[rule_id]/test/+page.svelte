<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  import PageRoleCheck from "$lib/components/PageRoleCheck.svelte";
  import {
    Shield,
    Edit,
    ArrowLeft,
    Play,
    AlertCircle,
    CheckCircle,
    XCircle,
    Code,
    Info,
  } from "@lucide/svelte";

  let {
    data,
  }: {
    data: PageData & {
      rule: any;
      ruleId: string;
      userEntitlements: any[];
      requiredRoles: any[];
    };
  } = $props();

  // Parameter management
  let parameters = $state<Record<string, any>>({});
  let executeResult = $state<any>(null);
  let executeError = $state<string>("");
  let isExecuting = $state(false);

  // Common parameter names for ABAC rules
  const commonParameters = [
    { name: "user.user_id", type: "string", description: "User ID" },
    {
      name: "user.emailAddress",
      type: "string",
      description: "User email address",
    },
    { name: "user.bank_id", type: "string", description: "User's bank ID" },
    {
      name: "account.owner_id",
      type: "string",
      description: "Account owner ID",
    },
    {
      name: "account.bank_id",
      type: "string",
      description: "Account's bank ID",
    },
    {
      name: "resource.bank_id",
      type: "string",
      description: "Resource bank ID",
    },
  ];

  // Extract parameter names from rule code
  function extractParametersFromCode(code: string): string[] {
    const paramPattern = /\b(user|account|resource|context)\.\w+(\.\w+)*/g;
    const matches = code.match(paramPattern) || [];
    return [...new Set(matches)];
  }

  let detectedParameters = $derived.by(() => {
    if (data.rule?.rule_code) {
      return extractParametersFromCode(data.rule.rule_code);
    }
    return [];
  });

  // Initialize parameters from detected ones
  $effect(() => {
    if (detectedParameters.length > 0) {
      const newParams: Record<string, any> = {};
      detectedParameters.forEach((param) => {
        if (!(param in parameters)) {
          newParams[param] = "";
        }
      });
      parameters = { ...parameters, ...newParams };
    }
  });

  async function handleExecute() {
    executeError = "";
    executeResult = null;
    isExecuting = true;

    try {
      // Build the execution payload
      const payload = {
        rule_code: data.rule.rule_code,
        parameters: parameters,
      };

      // Call the execute API endpoint
      const response = await fetch(`/api/abac-rules/${data.ruleId}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to execute ABAC rule");
      }

      const result = await response.json();
      executeResult = result;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to execute ABAC rule";
      executeError = errorMsg;
    } finally {
      isExecuting = false;
    }
  }

  function handleEdit() {
    goto(`/abac/rules/${data.ruleId}/edit`);
  }

  function handleBack() {
    goto("/abac/rules");
  }

  function addParameter() {
    const paramName = prompt("Enter parameter name (e.g., user.email):");
    if (paramName && paramName.trim()) {
      parameters[paramName.trim()] = "";
      parameters = { ...parameters };
    }
  }

  function removeParameter(paramName: string) {
    const { [paramName]: removed, ...rest } = parameters;
    parameters = rest;
  }
</script>

<svelte:head>
  <title>Test ABAC Rule - API Manager II</title>
</svelte:head>

<PageRoleCheck
  userEntitlements={data.userEntitlements}
  requiredRoles={data.requiredRoles}
>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-6">
      <button
        onclick={handleBack}
        class="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <ArrowLeft size={16} />
        Back to Rules
      </button>
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Test Rule: {data.rule?.rule_name || "ABAC Rule"}
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Rule ID: {data.ruleId}
          </p>
        </div>
        <button onclick={handleEdit} class="btn-primary">
          <Edit size={16} />
          Edit Rule
        </button>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Rule Details Panel -->
      <div class="panel">
        <div class="panel-header">
          <div class="flex items-center gap-2">
            <Shield size={20} />
            <h2 class="panel-title">Rule Details</h2>
          </div>
        </div>
        <div class="panel-content space-y-4">
          <!-- Status -->
          <div class="detail-group">
            <div class="detail-label">Status</div>
            <div>
              <span
                class="status-badge {data.rule?.is_active
                  ? 'status-active'
                  : 'status-inactive'}"
              >
                {data.rule?.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <!-- Description -->
          {#if data.rule?.description}
            <div class="detail-group">
              <div class="detail-label">Description</div>
              <p class="detail-value">{data.rule.description}</p>
            </div>
          {/if}

          <!-- Rule Code -->
          <div class="detail-group">
            <div class="detail-label">Rule Code</div>
            <div
              class="code-block rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
            >
              <pre class="overflow-x-auto text-sm"><code
                  >{data.rule?.rule_code}</code
                ></pre>
            </div>
          </div>

          <!-- Detected Parameters -->
          {#if detectedParameters.length > 0}
            <div class="detail-group">
              <div class="detail-label">Detected Parameters</div>
              <div class="flex flex-wrap gap-2">
                {#each detectedParameters as param}
                  <span
                    class="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {param}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Metadata -->
          <div class="detail-group">
            <div class="detail-label">Created</div>
            <p class="detail-value">
              {#if data.rule?.created_at}
                {new Date(data.rule.created_at).toLocaleString()}
              {:else}
                N/A
              {/if}
            </p>
          </div>

          {#if data.rule?.updated_at}
            <div class="detail-group">
              <div class="detail-label">Last Updated</div>
              <p class="detail-value">
                {new Date(data.rule.updated_at).toLocaleString()}
              </p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Execute Panel -->
      <div class="panel">
        <div class="panel-header">
          <div class="flex items-center gap-2">
            <Play size={20} />
            <h2 class="panel-title">Test Execution</h2>
          </div>
        </div>
        <div class="panel-content">
          <!-- Info Banner -->
          <div
            class="mb-4 flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20"
          >
            <Info
              class="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
              size={18}
            />
            <p class="text-xs text-blue-800 dark:text-blue-200">
              Test your ABAC rule by providing parameter values. The rule will
              be evaluated with these values and return a result.
            </p>
          </div>

          <!-- Parameters Form -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Parameters
              </div>
              <button
                type="button"
                onclick={addParameter}
                class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                + Add Parameter
              </button>
            </div>

            {#if Object.keys(parameters).length === 0}
              <div
                class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900"
              >
                <Code class="mx-auto mb-2 text-gray-400" size={24} />
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  No parameters detected. Add parameters manually to test the
                  rule.
                </p>
              </div>
            {:else}
              <div class="space-y-3">
                {#each Object.keys(parameters) as paramName}
                  <div class="parameter-input-group">
                    <div class="flex items-center justify-between mb-1">
                      <label
                        for={paramName}
                        class="text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        {paramName}
                      </label>
                      <button
                        type="button"
                        onclick={() => removeParameter(paramName)}
                        class="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      id={paramName}
                      type="text"
                      bind:value={parameters[paramName]}
                      placeholder="Enter value..."
                      class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Execute Button -->
            <button
              onclick={handleExecute}
              disabled={isExecuting || Object.keys(parameters).length === 0}
              class="btn-execute"
            >
              {#if isExecuting}
                <svg
                  class="h-4 w-4 animate-spin"
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
                Executing...
              {:else}
                <Play size={16} />
                Execute Rule
              {/if}
            </button>

            <!-- Execution Results -->
            {#if executeError}
              <div
                class="result-box result-error flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
              >
                <XCircle
                  class="shrink-0 text-red-600 dark:text-red-400"
                  size={20}
                />
                <div class="flex-1">
                  <h4
                    class="text-sm font-semibold text-red-800 dark:text-red-200"
                  >
                    Execution Failed
                  </h4>
                  <p class="mt-1 text-sm text-red-700 dark:text-red-300">
                    {executeError}
                  </p>
                </div>
              </div>
            {/if}

            {#if executeResult}
              <div
                class="result-box result-success flex items-start gap-3 rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
              >
                <CheckCircle
                  class="shrink-0 text-green-600 dark:text-green-400"
                  size={20}
                />
                <div class="flex-1">
                  <h4
                    class="text-sm font-semibold text-green-800 dark:text-green-200"
                  >
                    Execution Result
                  </h4>
                  <div
                    class="mt-2 rounded border border-green-200 bg-white p-3 dark:border-green-700 dark:bg-gray-800"
                  >
                    <pre
                      class="overflow-x-auto text-xs text-gray-800 dark:text-gray-200">{JSON.stringify(
                        executeResult,
                        null,
                        2,
                      )}</pre>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</PageRoleCheck>

<style>
  .container {
    max-width: 1400px;
  }

  .panel {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  :global([data-mode="dark"]) .panel {
    background: rgb(31, 41, 55);
  }

  .panel-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .panel-header {
    border-bottom-color: rgb(55, 65, 81);
  }

  .panel-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  :global([data-mode="dark"]) .panel-title {
    color: #f9fafb;
  }

  .panel-content {
    padding: 1.5rem;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  :global([data-mode="dark"]) .btn-primary:hover {
    background: #2563eb;
  }

  .btn-execute {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-execute:hover:not(:disabled) {
    background: #059669;
  }

  .btn-execute:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .detail-group {
    padding-bottom: 1rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .detail-group:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  :global([data-mode="dark"]) .detail-group {
    border-bottom-color: rgb(55, 65, 81);
  }

  .detail-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  :global([data-mode="dark"]) .detail-label {
    color: #9ca3af;
  }

  .detail-value {
    font-size: 0.875rem;
    color: #111827;
    line-height: 1.5;
  }

  :global([data-mode="dark"]) .detail-value {
    color: #f9fafb;
  }

  .code-block {
    font-family: "Monaco", "Courier New", monospace;
  }

  .code-block code {
    color: #1f2937;
  }

  :global([data-mode="dark"]) .code-block code {
    color: #f9fafb;
  }

  .status-badge {
    display: inline-flex;
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-active {
    background: #10b981;
    color: #ffffff;
  }

  .status-inactive {
    background: #ef4444;
    color: #ffffff;
  }

  .parameter-input-group {
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .parameter-input-group {
    background: rgb(17, 24, 39);
    border-color: rgb(55, 65, 81);
  }

  .result-box {
    margin-top: 1rem;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 1024px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
