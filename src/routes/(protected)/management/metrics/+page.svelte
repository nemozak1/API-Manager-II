<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  import { configHelpers } from "$lib/config";

  export let data: PageData;

  $: recentMetrics = data.recentMetrics;
  $: queryMetrics = data.queryMetrics;
  $: hasApiAccess = data.hasApiAccess;
  $: error = data.error;

  let refreshInterval: NodeJS.Timeout;
  let currentTime = new Date().toLocaleString();

  // Configuration information
  $: obpInfo = configHelpers.getObpConnectionInfo();

  // Form data for query panel
  let queryForm = {
    from_date: "",
    to_date: "",
    limit: "100",
    offset: "0",
    sort_by: "date",
    direction: "desc",
    consumer_id: "",
    user_id: "",
    anon: "",
    url: "",
    app_name: "",
    implemented_by_partial_function: "",
    implemented_in_version: "",
    verb: "",
    correlation_id: "",
    duration: "",
  };

  onMount(() => {
    // Set default date range (last hour)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    queryForm.from_date = oneHourAgo.toISOString().slice(0, 19);
    queryForm.to_date = now.toISOString().slice(0, 19);

    // Auto-refresh every 5 seconds for real-time panel
    refreshInterval = setInterval(() => {
      refreshRecentMetrics();
      currentTime = new Date().toLocaleString();
    }, 5000);

    // Update current time every second
    setInterval(() => {
      currentTime = new Date().toLocaleString();
    }, 1000);
  });

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  function refreshRecentMetrics() {
    // Trigger a refresh by navigating to the same page
    const url = new URL(window.location.href);
    url.searchParams.set("refresh", Date.now().toString());
    goto(url.pathname + url.search, { replaceState: true });
  }

  function submitQuery() {
    const params = new URLSearchParams();

    Object.entries(queryForm).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        params.append(key, value);
      }
    });

    goto(`/management/metrics?${params.toString()}`);
  }

  function clearQuery() {
    queryForm = {
      from_date: "",
      to_date: "",
      limit: "100",
      offset: "0",
      sort_by: "date",
      direction: "desc",
      consumer_id: "",
      user_id: "",
      anon: "",
      url: "",
      app_name: "",
      implemented_by_partial_function: "",
      implemented_in_version: "",
      verb: "",
      correlation_id: "",
      duration: "",
    };

    // Reset default date range
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    queryForm.from_date = oneHourAgo.toISOString().slice(0, 19);
    queryForm.to_date = now.toISOString().slice(0, 19);
  }

  function formatDuration(duration: number): string {
    if (duration < 1000) {
      return `${duration}ms`;
    }
    return `${(duration / 1000).toFixed(2)}s`;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  function getVerbColor(verb: string): string {
    switch (verb.toUpperCase()) {
      case "GET":
        return "text-green-600 bg-green-50";
      case "POST":
        return "text-blue-600 bg-blue-50";
      case "PUT":
        return "text-yellow-600 bg-yellow-50";
      case "DELETE":
        return "text-red-600 bg-red-50";
      case "PATCH":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  }
</script>

<svelte:head>
  <title>API Metrics - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <header class="text-center mb-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-2">API Metrics</h1>
    <p class="text-gray-600">
      Real-time monitoring and analysis of Open Bank Project API calls
    </p>
  </header>

  <!-- Navigation Breadcrumb -->
  <nav class="breadcrumb mb-8">
    <a href="/" class="breadcrumb-link">Home</a>
    <span class="breadcrumb-separator">›</span>
    <a href="/management" class="breadcrumb-link">Management</a>
    <span class="breadcrumb-separator">›</span>
    <span class="breadcrumb-current">Metrics</span>
  </nav>

  <!-- Error Alert -->
  {#if error && !hasApiAccess}
    <div class="alert alert-error mb-6">
      <strong>API Access Limited:</strong>
      {error}
    </div>
  {/if}

  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <!-- Panel 1: Real-time Recent API Calls -->
    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title">Recent API Calls</h2>
        <div class="panel-subtitle">
          Last 50 API calls • Target: {obpInfo.displayName} • Last updated:
          {currentTime}
        </div>
        <button
          class="refresh-btn"
          on:click={refreshRecentMetrics}
          title="Manual refresh"
        >
          🔄
        </button>
      </div>

      <div class="panel-content">
        {#if recentMetrics?.metrics && recentMetrics.metrics.length > 0}
          <div class="metrics-table-container">
            <table class="metrics-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Method</th>
                  <th>URL</th>
                  <th>User</th>
                  <th>App</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {#each recentMetrics.metrics as metric}
                  <tr>
                    <td class="time-cell">
                      {formatDate(metric.date)}
                    </td>
                    <td>
                      <span class="verb-badge {getVerbColor(metric.verb)}">
                        {metric.verb}
                      </span>
                    </td>
                    <td class="url-cell" title={metric.url}>
                      {metric.url.length > 40
                        ? metric.url.substring(0, 40) + "..."
                        : metric.url}
                    </td>
                    <td class="user-cell">
                      {metric.user_name || "Anonymous"}
                    </td>
                    <td class="app-cell">
                      {metric.app_name || "N/A"}
                    </td>
                    <td class="duration-cell">
                      {formatDuration(metric.duration)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="metrics-summary">
            Showing {recentMetrics.count} recent API calls (last 50 records) from
            {obpInfo.displayName}
          </div>
        {:else if hasApiAccess}
          <div class="empty-state">
            <div
              style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; text-align: center;"
            >
              📡
            </div>
            <h4
              style="color: #4a5568; margin-bottom: 0.5rem; font-size: 1.125rem; text-align: center;"
            >
              No Recent API Calls
            </h4>
            <p style="text-align: center; margin-bottom: 1.5rem;">
              No recent API requests found for <strong
                >{obpInfo.displayName}</strong
              >.
            </p>
            <div
              style="background: #f7fafc; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; text-align: left;"
            >
              <h5
                style="color: #2d3748; margin-bottom: 0.5rem; font-size: 0.875rem;"
              >
                Server Configuration:
              </h5>
              <div
                style="font-family: monospace; font-size: 0.75rem; color: #4a5568;"
              >
                <div>• Base URL: {obpInfo.baseUrl}</div>
                <div>• API URL: {obpInfo.apiUrl}</div>
                <div>• OIDC URL: {obpInfo.oidcUrl}</div>
              </div>
            </div>
            <button
              class="refresh-btn"
              on:click={refreshRecentMetrics}
              style="display: block; margin: 0 auto;"
            >
              🔄 Refresh Data
            </button>
          </div>
        {:else}
          <div class="empty-state">
            <div
              style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; text-align: center;"
            >
              🔒
            </div>
            <h4
              style="color: #e53e3e; margin-bottom: 0.5rem; font-size: 1.125rem; text-align: center;"
            >
              API Access Unavailable
            </h4>
            <p style="text-align: center; margin-bottom: 1rem;">
              Cannot connect to OBP server at <strong
                >{obpInfo.displayName}</strong
              >
            </p>
            <p style="text-align: center; font-size: 0.875rem; color: #718096;">
              Please check your authentication or server configuration.
            </p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Panel 2: Query Interface -->
    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title">Query Metrics</h2>
        <div class="panel-subtitle">
          Search and filter API metrics with custom parameters
        </div>
      </div>

      <div class="panel-content">
        <!-- Query Form -->
        <form on:submit|preventDefault={submitQuery} class="query-form">
          <div class="form-section">
            <h3 class="form-section-title">Date Range</h3>
            <div class="form-row">
              <div class="form-field">
                <label for="from_date">From Date</label>
                <input
                  type="datetime-local"
                  id="from_date"
                  bind:value={queryForm.from_date}
                  class="form-input"
                />
              </div>
              <div class="form-field">
                <label for="to_date">To Date</label>
                <input
                  type="datetime-local"
                  id="to_date"
                  bind:value={queryForm.to_date}
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3 class="form-section-title">Pagination & Sorting</h3>
            <div class="form-row">
              <div class="form-field">
                <label for="limit">Limit</label>
                <input
                  type="number"
                  id="limit"
                  bind:value={queryForm.limit}
                  min="1"
                  max="10000"
                  class="form-input"
                />
              </div>
              <div class="form-field">
                <label for="offset">Offset</label>
                <input
                  type="number"
                  id="offset"
                  bind:value={queryForm.offset}
                  min="0"
                  class="form-input"
                />
              </div>
              <div class="form-field">
                <label for="sort_by">Sort By</label>
                <select
                  id="sort_by"
                  bind:value={queryForm.sort_by}
                  class="form-input"
                >
                  <option value="date">Date</option>
                  <option value="url">URL</option>
                  <option value="user_name">User Name</option>
                  <option value="app_name">App Name</option>
                  <option value="verb">HTTP Method</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
              <div class="form-field">
                <label for="direction">Direction</label>
                <select
                  id="direction"
                  bind:value={queryForm.direction}
                  class="form-input"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3 class="form-section-title">Filters</h3>
            <div class="form-row">
              <div class="form-field">
                <label for="verb">HTTP Method</label>
                <select
                  id="verb"
                  bind:value={queryForm.verb}
                  class="form-input"
                >
                  <option value="">All Methods</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div class="form-field">
                <label for="app_name">App Name</label>
                <input
                  type="text"
                  id="app_name"
                  bind:value={queryForm.app_name}
                  placeholder="Filter by app name"
                  class="form-input"
                />
              </div>
              <div class="form-field">
                <label for="user_name">User</label>
                <input
                  type="text"
                  id="user_name"
                  bind:value={queryForm.user_name}
                  placeholder="Filter by user"
                  class="form-input"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label for="url">URL Contains</label>
                <input
                  type="text"
                  id="url"
                  bind:value={queryForm.url}
                  placeholder="Filter by URL"
                  class="form-input"
                />
              </div>
              <div class="form-field">
                <label for="consumer_id">Consumer ID</label>
                <input
                  type="text"
                  id="consumer_id"
                  bind:value={queryForm.consumer_id}
                  placeholder="Filter by consumer ID"
                  class="form-input"
                />
              </div>
              <div class="form-field">
                <label for="anon">Anonymous</label>
                <select
                  id="anon"
                  bind:value={queryForm.anon}
                  class="form-input"
                >
                  <option value="">All Users</option>
                  <option value="true">Anonymous Only</option>
                  <option value="false">Authenticated Only</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              🔍 Query Metrics
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              on:click={clearQuery}
            >
              🗑️ Clear Form
            </button>
          </div>
        </form>

        <!-- Query Results -->
        {#if queryMetrics}
          <div class="query-results">
            <div class="results-header">
              <h3>Query Results</h3>
              <span class="results-count">
                {queryMetrics.count} results found
              </span>
            </div>

            {#if queryMetrics.metrics && queryMetrics.metrics.length > 0}
              <div class="metrics-table-container">
                <table class="metrics-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Method</th>
                      <th>URL</th>
                      <th>User</th>
                      <th>App</th>
                      <th>Duration</th>
                      <th>Version</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each queryMetrics.metrics as metric}
                      <tr>
                        <td class="time-cell">
                          {formatDate(metric.date)}
                        </td>
                        <td>
                          <span class="verb-badge {getVerbColor(metric.verb)}">
                            {metric.verb}
                          </span>
                        </td>
                        <td class="url-cell" title={metric.url}>
                          {metric.url.length > 50
                            ? metric.url.substring(0, 50) + "..."
                            : metric.url}
                        </td>
                        <td class="user-cell">
                          {metric.user_name || "Anonymous"}
                        </td>
                        <td class="app-cell">
                          {metric.app_name || "N/A"}
                        </td>
                        <td class="duration-cell">
                          {formatDuration(metric.duration)}
                        </td>
                        <td class="version-cell">
                          {metric.implemented_in_version || "N/A"}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {:else}
              <div class="empty-state">
                <p>
                  No results found for your query. Try adjusting the filters.
                </p>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 1400px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .breadcrumb-link {
    color: #3b82f6;
    text-decoration: none;
  }

  .breadcrumb-link:hover {
    color: #1d4ed8;
  }

  .breadcrumb-separator {
    margin: 0 0.5rem;
    color: #d1d5db;
  }

  .breadcrumb-current {
    color: #374151;
    font-weight: 500;
  }

  .alert {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .alert-error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
  }

  .panel {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
  }

  .panel-header {
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .panel-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .panel-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .refresh-btn {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .refresh-btn:hover {
    background: #e5e7eb;
  }

  .panel-content {
    padding: 1.5rem;
  }

  .metrics-table-container {
    overflow-x: auto;
    margin-bottom: 1rem;
  }

  .metrics-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .metrics-table th {
    background: #f9fafb;
    padding: 0.75rem 0.5rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
  }

  .metrics-table td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: top;
  }

  .metrics-table tr:hover {
    background: #f9fafb;
  }

  .time-cell {
    font-family: monospace;
    font-size: 0.8125rem;
    color: #6b7280;
    white-space: nowrap;
  }

  .url-cell {
    font-family: monospace;
    font-size: 0.8125rem;
    max-width: 300px;
    word-break: break-all;
  }

  .user-cell,
  .app-cell,
  .version-cell {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .duration-cell {
    font-family: monospace;
    font-weight: 500;
    text-align: right;
    white-space: nowrap;
  }

  .verb-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    display: inline-block;
    min-width: 4rem;
    text-align: center;
  }

  .metrics-summary {
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 6px;
  }

  .empty-state {
    text-align: center;
    color: #6b7280;
    padding: 2rem;
  }

  .query-form {
    margin-bottom: 2rem;
  }

  .form-section {
    margin-bottom: 1.5rem;
  }

  .form-section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
  }

  .form-field label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
  }

  .form-input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  .query-results {
    margin-top: 2rem;
    border-top: 1px solid #e5e7eb;
    padding-top: 2rem;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .results-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .results-count {
    font-size: 0.875rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
  }

  @media (max-width: 1200px) {
    .form-row {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .panel-header {
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }

    .results-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
