<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  let logs = $state<any[]>([]);
  let logLevel = $state<string>("");
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let lastUpdated = $state<string>("");
  let refreshInterval: NodeJS.Timeout | null = null;

  const logLevels = [
    { value: "", label: "All Levels" },
    { value: "ERROR", label: "Error" },
    { value: "WARN", label: "Warning" },
    { value: "INFO", label: "Info" },
    { value: "DEBUG", label: "Debug" },
  ];

  async function fetchLogs() {
    try {
      isLoading = true;
      error = null;

      const params = new URLSearchParams();
      if (logLevel) {
        params.append("log_level", logLevel);
      }

      const url = `/api/devops/log-cache${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      logs = data.logs || [];
      lastUpdated = new Date().toLocaleString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to fetch logs";
      console.error("Error fetching logs:", err);
    } finally {
      isLoading = false;
    }
  }

  function startAutoRefresh() {
    // Initial fetch
    fetchLogs();

    // Set up 5-second interval
    refreshInterval = setInterval(() => {
      fetchLogs();
    }, 5000);
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  function handleLogLevelChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    logLevel = target.value;
    // Restart auto-refresh with new log level
    stopAutoRefresh();
    startAutoRefresh();
  }

  function formatTimestamp(timestamp: string): string {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  }

  function getLogLevelClass(level: string): string {
    switch (level?.toUpperCase()) {
      case "ERROR":
        return "log-level-error";
      case "WARN":
        return "log-level-warn";
      case "INFO":
        return "log-level-info";
      case "DEBUG":
        return "log-level-debug";
      default:
        return "";
    }
  }

  onMount(() => {
    startAutoRefresh();
  });

  onDestroy(() => {
    stopAutoRefresh();
  });
</script>

<svelte:head>
  <title>LogCache - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="panel">
    <div class="panel-header">
      <div class="header-content">
        <div>
          <h1 class="panel-title">LogCache</h1>
          <div class="panel-subtitle">
            View and monitor cached logs from the OBP API
          </div>
        </div>
        <div class="header-controls">
          <div class="filter-group">
            <label for="logLevel" class="filter-label">Log Level:</label>
            <select
              id="logLevel"
              value={logLevel}
              onchange={handleLogLevelChange}
              class="filter-select"
            >
              {#each logLevels as level}
                <option value={level.value}>{level.label}</option>
              {/each}
            </select>
          </div>
          {#if lastUpdated}
            <div class="last-updated">
              Last updated: <span class="timestamp">{lastUpdated}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
    <div class="panel-content">
      {#if error}
        <div class="alert alert-error">
          <strong>Error:</strong>
          {error}
        </div>
      {/if}

      {#if isLoading && logs.length === 0}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading logs...</p>
        </div>
      {:else if logs.length > 0}
        <div class="logs-container">
          <div class="table-wrapper">
            <table class="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Level</th>
                  <th>Message</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {#each logs as log}
                  <tr>
                    <td class="timestamp-cell">
                      {formatTimestamp(log.timestamp || log.date)}
                    </td>
                    <td>
                      <span
                        class="log-level-badge {getLogLevelClass(
                          log.level || log.log_level,
                        )}"
                      >
                        {log.level || log.log_level || "N/A"}
                      </span>
                    </td>
                    <td class="message-cell">{log.message || "N/A"}</td>
                    <td class="source-cell">
                      {log.source || log.logger || "N/A"}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="logs-count">Showing {logs.length} log entries</div>
        </div>
      {:else}
        <div class="empty-state">
          <p>No logs found</p>
          {#if logLevel}
            <p class="text-sm">Try selecting a different log level</p>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 1600px;
  }

  .panel {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  :global([data-mode="dark"]) .panel {
    background: rgb(var(--color-surface-800));
  }

  .panel-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .panel-header {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .panel-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  :global([data-mode="dark"]) .panel-title {
    color: var(--color-surface-100);
  }

  .panel-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }

  :global([data-mode="dark"]) .panel-subtitle {
    color: var(--color-surface-400);
  }

  .header-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-end;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  :global([data-mode="dark"]) .filter-label {
    color: var(--color-surface-300);
  }

  .filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: white;
    color: #111827;
    cursor: pointer;
  }

  :global([data-mode="dark"]) .filter-select {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
    color: var(--color-surface-100);
  }

  .filter-select:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px;
    ring-color: rgba(59, 130, 246, 0.2);
  }

  .last-updated {
    font-size: 0.75rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .last-updated {
    color: var(--color-surface-400);
  }

  .timestamp {
    font-family: monospace;
    font-weight: 500;
    color: #374151;
  }

  :global([data-mode="dark"]) .timestamp {
    color: var(--color-surface-300);
  }

  .panel-content {
    padding: 1.5rem;
  }

  .logs-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  :global([data-mode="dark"]) .table-wrapper {
    border-color: rgb(var(--color-surface-700));
  }

  .logs-table {
    width: 100%;
    border-collapse: collapse;
  }

  .logs-table th {
    text-align: left;
    padding: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .logs-table th {
    color: var(--color-surface-300);
    background: rgb(var(--color-surface-700));
    border-bottom-color: rgb(var(--color-surface-600));
  }

  .logs-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
    color: #111827;
  }

  :global([data-mode="dark"]) .logs-table td {
    border-bottom-color: rgb(var(--color-surface-700));
    color: var(--color-surface-100);
  }

  .logs-table tbody tr:hover {
    background: #f9fafb;
  }

  :global([data-mode="dark"]) .logs-table tbody tr:hover {
    background: rgb(var(--color-surface-700));
  }

  .logs-table tbody tr:last-child td {
    border-bottom: none;
  }

  .timestamp-cell {
    font-family: monospace;
    font-size: 0.8125rem;
    white-space: nowrap;
  }

  .message-cell {
    max-width: 600px;
    word-wrap: break-word;
  }

  .source-cell {
    font-family: monospace;
    font-size: 0.8125rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .source-cell {
    color: var(--color-surface-400);
  }

  .log-level-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .log-level-error {
    background: #fee2e2;
    color: #991b1b;
  }

  :global([data-mode="dark"]) .log-level-error {
    background: rgb(var(--color-error-900));
    color: rgb(var(--color-error-200));
  }

  .log-level-warn {
    background: #fef3c7;
    color: #92400e;
  }

  :global([data-mode="dark"]) .log-level-warn {
    background: rgba(251, 191, 36, 0.2);
    color: rgb(253, 224, 71);
  }

  .log-level-info {
    background: #dbeafe;
    color: #1e40af;
  }

  :global([data-mode="dark"]) .log-level-info {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(147, 197, 253);
  }

  .log-level-debug {
    background: #e5e7eb;
    color: #374151;
  }

  :global([data-mode="dark"]) .log-level-debug {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-300);
  }

  .logs-count {
    font-size: 0.875rem;
    color: #6b7280;
    text-align: right;
  }

  :global([data-mode="dark"]) .logs-count {
    color: var(--color-surface-400);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  :global([data-mode="dark"]) .spinner {
    border-color: rgb(var(--color-surface-700));
    border-top-color: rgb(var(--color-primary-400));
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .empty-state {
    color: var(--color-surface-400);
  }

  .empty-state .text-sm {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .alert {
    padding: 1rem;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }

  .alert-error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  :global([data-mode="dark"]) .alert-error {
    background: rgb(var(--color-error-900));
    color: rgb(var(--color-error-200));
    border-color: rgb(var(--color-error-800));
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      align-items: stretch;
    }

    .header-controls {
      align-items: stretch;
    }

    .filter-group {
      flex-direction: column;
      align-items: stretch;
      gap: 0.25rem;
    }

    .filter-select {
      width: 100%;
    }

    .last-updated {
      text-align: center;
    }
  }
</style>
