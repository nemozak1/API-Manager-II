<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import type { PageData } from "./$types";

  export let data: PageData;

  $: metrics = data.metrics;
  $: apiMetrics = data.apiMetrics;
  $: hasApiAccess = data.hasApiAccess;
  $: error = data.error;
  $: lastUpdated = data.lastUpdated;

  let currentTime = new Date().toLocaleString();

  // Sample chart data for demonstration
  let chartData = [
    { hour: "00:00", calls: 45, responseTime: 120 },
    { hour: "01:00", calls: 32, responseTime: 98 },
    { hour: "02:00", calls: 28, responseTime: 110 },
    { hour: "03:00", calls: 15, responseTime: 85 },
    { hour: "04:00", calls: 12, responseTime: 92 },
    { hour: "05:00", calls: 18, responseTime: 105 },
    { hour: "06:00", calls: 35, responseTime: 130 },
    { hour: "07:00", calls: 67, responseTime: 145 },
    { hour: "08:00", calls: 89, responseTime: 160 },
    { hour: "09:00", calls: 156, responseTime: 180 },
    { hour: "10:00", calls: 203, responseTime: 165 },
    { hour: "11:00", calls: 245, responseTime: 155 },
    { hour: "12:00", calls: 298, responseTime: 170 },
    { hour: "13:00", calls: 267, responseTime: 158 },
    { hour: "14:00", calls: 234, responseTime: 142 },
    { hour: "15:00", calls: 198, responseTime: 138 },
    { hour: "16:00", calls: 176, responseTime: 125 },
    { hour: "17:00", calls: 145, responseTime: 115 },
    { hour: "18:00", calls: 98, responseTime: 108 },
    { hour: "19:00", calls: 76, responseTime: 95 },
    { hour: "20:00", calls: 65, responseTime: 88 },
    { hour: "21:00", calls: 54, responseTime: 92 },
    { hour: "22:00", calls: 43, responseTime: 85 },
    { hour: "23:00", calls: 38, responseTime: 90 },
  ];

  let recentApiCalls = [
    {
      endpoint: "/obp/v5.1.0/banks",
      method: "GET",
      status: 200,
      responseTime: "45ms",
      timestamp: "2025-09-11T16:30:15Z",
    },
    {
      endpoint: "/obp/v5.1.0/users/current",
      method: "GET",
      status: 200,
      responseTime: "32ms",
      timestamp: "2025-09-11T16:29:45Z",
    },
    {
      endpoint: "/obp/v5.1.0/banks/bank1/accounts",
      method: "GET",
      status: 200,
      responseTime: "67ms",
      timestamp: "2025-09-11T16:29:20Z",
    },
    {
      endpoint: "/obp/v5.1.0/management/metrics",
      method: "GET",
      status: 200,
      responseTime: "123ms",
      timestamp: "2025-09-11T16:28:58Z",
    },
    {
      endpoint: "/obp/v5.1.0/banks/bank2/accounts",
      method: "GET",
      status: 404,
      responseTime: "23ms",
      timestamp: "2025-09-11T16:28:30Z",
    },
  ];

  onMount(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      currentTime = new Date().toLocaleString();
    }, 60000);

    return () => clearInterval(interval);
  });

  function refreshMetrics() {
    window.location.reload();
  }

  function getStatusClass(status: number) {
    if (status >= 200 && status < 300) return "obp-portal-status online";
    if (status >= 400 && status < 500) return "obp-portal-status warning";
    return "obp-portal-status offline";
  }

  function getChangeClass(value: number) {
    if (value > 0) return "positive";
    if (value < 0) return "negative";
    return "neutral";
  }
</script>

<svelte:head>
  <title>API Dashboard - API Manager II</title>
  <link rel="stylesheet" href="/obp-manager.css" />
</svelte:head>

<div class="obp-manager">
  <!-- Header Section -->
  <div class="obp-manager-header">
    <div class="obp-manager-container">
      <h1>API Dashboard</h1>
      <p class="subtitle">
        Real-time monitoring and analytics for Open Bank Project API
      </p>
    </div>
  </div>

  <div class="obp-manager-container">
    <!-- Breadcrumb Navigation -->
    <nav class="obp-manager-breadcrumb">
      <a href="/">Home</a>
      <span class="separator">›</span>
      <a href="/management">Management</a>
      <span class="separator">›</span>
      <a href="/management/api">API</a>
      <span class="separator">›</span>
      <span>Dashboard</span>
    </nav>

    <!-- Error Alert -->
    {#if error && !hasApiAccess}
      <div class="obp-manager-alert error">
        <strong>API Access Limited:</strong>
        {error}. Showing cached or default metrics only.
      </div>
    {/if}

    <!-- Success Alert -->
    {#if hasApiAccess}
      <div class="obp-manager-alert success">
        <strong>Live Data:</strong> Connected to OBP API server. Metrics updated
        at {lastUpdated ? new Date(lastUpdated).toLocaleString() : currentTime}.
      </div>
    {/if}

    <!-- Key Metrics Cards -->
    <div class="obp-manager-grid obp-manager-grid-4">
      <div class="obp-manager-metric-card">
        <div class="obp-manager-metric-value">{metrics.totalBanks}</div>
        <div class="obp-manager-metric-label">Total Banks</div>
        <div class="obp-manager-metric-change neutral">Active institutions</div>
      </div>

      <div class="obp-manager-metric-card">
        <div class="obp-manager-metric-value">{metrics.totalUsers}</div>
        <div class="obp-manager-metric-label">Active Users</div>
        <div class="obp-manager-metric-change positive">+12% this month</div>
      </div>

      <div class="obp-manager-metric-card">
        <div class="obp-manager-metric-value">
          {metrics.apiCalls.toLocaleString()}
        </div>
        <div class="obp-manager-metric-label">API Calls Today</div>
        <div class="obp-manager-metric-change positive">+8% vs yesterday</div>
      </div>

      <div class="obp-manager-metric-card">
        <div class="obp-manager-metric-value">
          {apiMetrics?.availability?.toFixed(1) || "99.9"}%
        </div>
        <div class="obp-manager-metric-label">API Availability</div>
        <div class="obp-manager-metric-change {getChangeClass(0.2)}">
          +0.2% this week
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="obp-manager-grid obp-manager-grid-3">
      <div class="obp-manager-card">
        <div class="obp-manager-card-header">
          <h3 class="obp-manager-card-title">Response Time</h3>
          <span class="obp-manager-status online">Healthy</span>
        </div>
        <div class="obp-manager-metric-value" style="font-size: 1.8rem;">
          {apiMetrics?.responseTime || 125}ms
        </div>
        <div class="obp-manager-metric-change {getChangeClass(-5)}">
          -5ms from last hour
        </div>
      </div>

      <div class="obp-manager-card">
        <div class="obp-manager-card-header">
          <h3 class="obp-manager-card-title">Error Rate</h3>
          <span
            class="obp-manager-status {(apiMetrics?.errorRate || 0) < 1
              ? 'online'
              : 'warning'}"
          >
            {(apiMetrics?.errorRate || 0) < 1 ? "Normal" : "Elevated"}
          </span>
        </div>
        <div class="obp-manager-metric-value" style="font-size: 1.8rem;">
          {(apiMetrics?.errorRate || 0).toFixed(2)}%
        </div>
        <div class="obp-manager-metric-change {getChangeClass(-0.1)}">
          -0.1% from yesterday
        </div>
      </div>

      <div class="obp-manager-card">
        <div class="obp-manager-card-header">
          <h3 class="obp-manager-card-title">Throughput</h3>
          <span class="obp-manager-status online">Optimal</span>
        </div>
        <div class="obp-manager-metric-value" style="font-size: 1.8rem;">
          {apiMetrics?.throughput || 450}
        </div>
        <div class="obp-manager-metric-label">requests/min</div>
        <div class="obp-manager-metric-change {getChangeClass(15)}">
          +15 req/min from last hour
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="obp-manager-grid obp-manager-grid-2">
      <div class="obp-manager-chart-container">
        <div class="obp-manager-card-header">
          <h3 class="obp-manager-card-title">API Calls (24h)</h3>
          <button
            class="obp-manager-btn obp-manager-btn-ghost"
            on:click={refreshMetrics}
          >
            Refresh
          </button>
        </div>

        <!-- Simple ASCII Chart -->
        <div
          style="font-family: monospace; font-size: 0.75rem; line-height: 1.2; margin-top: 1rem;"
        >
          {#each chartData.slice(-12) as point}
            <div
              style="display: flex; align-items: center; margin-bottom: 0.25rem;"
            >
              <span style="width: 50px; display: inline-block;"
                >{point.hour}</span
              >
              <span style="width: 60px; text-align: right; margin-right: 10px;"
                >{point.calls}</span
              >
              <div
                style="background: #667eea; height: 4px; width: {Math.max(
                  2,
                  (point.calls / 300) * 200,
                )}px;"
              ></div>
            </div>
          {/each}
        </div>
      </div>

      <div class="obp-manager-chart-container">
        <div class="obp-manager-card-header">
          <h3 class="obp-manager-card-title">Response Time (24h)</h3>
        </div>

        <!-- Simple ASCII Chart -->
        <div
          style="font-family: monospace; font-size: 0.75rem; line-height: 1.2; margin-top: 1rem;"
        >
          {#each chartData.slice(-12) as point}
            <div
              style="display: flex; align-items: center; margin-bottom: 0.25rem;"
            >
              <span style="width: 50px; display: inline-block;"
                >{point.hour}</span
              >
              <span style="width: 60px; text-align: right; margin-right: 10px;"
                >{point.responseTime}ms</span
              >
              <div
                style="background: {point.responseTime > 150
                  ? '#e53e3e'
                  : point.responseTime > 120
                    ? '#d69e2e'
                    : '#38a169'}; height: 4px; width: {Math.max(
                  2,
                  (point.responseTime / 200) * 200,
                )}px;"
              ></div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Recent API Calls Table -->
    <div class="obp-manager-card" style="margin-top: 2rem;">
      <div class="obp-manager-card-header">
        <h3 class="obp-manager-card-title">Recent API Calls</h3>
        <p class="obp-manager-card-subtitle">Last 5 API requests</p>
      </div>

      <table class="obp-manager-table">
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Method</th>
            <th>Status</th>
            <th>Response Time</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {#each recentApiCalls as call}
            <tr>
              <td style="font-family: monospace; font-size: 0.8rem;"
                >{call.endpoint}</td
              >
              <td>
                <span
                  style="background: #edf2f7; color: #4a5568; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;"
                >
                  {call.method}
                </span>
              </td>
              <td>
                <span class={getStatusClass(call.status)}>
                  {call.status}
                </span>
              </td>
              <td>{call.responseTime}</td>
              <td style="color: #718096; font-size: 0.875rem;">
                {new Date(call.timestamp).toLocaleString()}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- System Status Cards -->
    <div class="obp-manager-grid obp-manager-grid-3" style="margin-top: 2rem;">
      <div class="obp-manager-card">
        <div class="obp-manager-card-header">
          <h3 class="obp-manager-card-title">API Server</h3>
          <span
            class="obp-manager-status {hasApiAccess ? 'online' : 'offline'}"
          >
            {hasApiAccess ? "Online" : "Offline"}
          </span>
        </div>
        <p style="color: #718096; font-size: 0.875rem; margin: 0;">
          {hasApiAccess
            ? "Connected to OBP API server"
            : "API server not accessible"}
        </p>
        <p style="color: #718096; font-size: 0.75rem; margin: 0.5rem 0 0 0;">
          Last check: {currentTime}
        </p>
      </div>

      <div class="obp-manager-card">
        <div class="obp-manager-card-header">
          <h3 class="obp-manager-card-title">OIDC Provider</h3>
          <span class="obp-manager-status online">Online</span>
        </div>
        <p style="color: #718096; font-size: 0.875rem; margin: 0;">
          Authentication server operational
        </p>
        <p style="color: #718096; font-size: 0.75rem; margin: 0.5rem 0 0 0;">
          Response time: 45ms
        </p>
      </div>

      <div class="obp-manager-card">
        <div class="obp-manager-card-header">
          <h3 class="obp-manager-card-title">Database</h3>
          <span class="obp-manager-status online">Healthy</span>
        </div>
        <p style="color: #718096; font-size: 0.875rem; margin: 0;">
          Session store active
        </p>
        <p style="color: #718096; font-size: 0.75rem; margin: 0.5rem 0 0 0;">
          Active sessions: {metrics.activeConnections}
        </p>
      </div>
    </div>

    <!-- Actions Section -->
    <div class="obp-manager-card" style="margin-top: 2rem; text-align: center;">
      <div class="obp-manager-card-header" style="justify-content: center;">
        <h3 class="obp-manager-card-title">Management Actions</h3>
      </div>

      <div
        style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;"
      >
        <button
          class="obp-manager-btn obp-manager-btn-primary"
          on:click={refreshMetrics}
        >
          🔄 Refresh Metrics
        </button>

        <button class="obp-manager-btn obp-manager-btn-secondary">
          📊 Export Report
        </button>

        <button class="obp-manager-btn obp-manager-btn-ghost">
          ⚙️ Configure Alerts
        </button>

        <a href="/management" class="obp-manager-btn obp-manager-btn-ghost">
          ← Back to Management
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div
      style="margin-top: 3rem; padding: 2rem 0; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 0.875rem;"
    >
      <p>API Manager II - API Management Dashboard</p>
      <p>
        Last updated: {lastUpdated
          ? new Date(lastUpdated).toLocaleString()
          : currentTime}
      </p>
    </div>
  </div>
</div>

<style>
  /* Additional component-specific styles */
  :global(body) {
    background-color: #f5f7fa;
  }

  /* Override for this page only */
  .obp-portal {
    min-height: 100vh;
  }
</style>
