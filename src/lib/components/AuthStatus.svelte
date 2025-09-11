<script lang="ts">
  export let user: any;
  export let authInfo: any;

  $: isFullAccess = authInfo?.source === "obp_api";
  $: isFallbackMode = authInfo?.source === "oidc_fallback";
  $: hasWarning = !!authInfo?.warning;
</script>

<div class="auth-status-container">
  <!-- User Info Section -->
  <div class="user-info">
    <div class="user-avatar">
      <div class="avatar-circle">
        <span class="avatar-text">
          {user?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
        </span>
      </div>
    </div>
    <div class="user-details">
      <h3 class="user-name">{user?.username || "User"}</h3>
      <p class="user-email">{user?.email || "No email"}</p>
    </div>
  </div>

  <!-- Authentication Status Section -->
  <div class="auth-info">
    {#if isFullAccess}
      <div class="status-badge status-success">
        <svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span class="status-text">Full OBP Access</span>
      </div>
      <p class="status-description">
        Connected to OBP API Server - Full banking data and user profile available
      </p>
      <div class="capabilities">
        <span class="capability-tag">Banking Data</span>
        <span class="capability-tag">Full Profile</span>
        <span class="capability-tag">API Access</span>
      </div>
    {/if}

    {#if isFallbackMode}
      <div class="status-badge status-warning">
        <svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span class="status-text">Limited Access (Fallback)</span>
      </div>
      <p class="status-description">
        {authInfo?.warning || "Using OIDC authentication only - Limited functionality available"}
      </p>
      <div class="capabilities">
        <span class="capability-tag limited">Basic Auth</span>
        <span class="capability-tag limited">Limited Profile</span>
      </div>

      <!-- Warning message -->
      <div class="warning-message">
        <svg class="warning-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <div class="warning-content">
          <strong>Reduced Functionality</strong>
          <p>OBP API server is not accessible. Some features may be unavailable. Contact your administrator if you need full banking data access.</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Connection Details (collapsible) -->
  <details class="connection-details">
    <summary class="details-summary">Connection Details</summary>
    <div class="details-content">
      <div class="detail-row">
        <span class="detail-label">Authentication Source:</span>
        <span class="detail-value">{authInfo?.sourceDescription || "Unknown"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">User ID:</span>
        <span class="detail-value">{user?.user_id || "N/A"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Provider:</span>
        <span class="detail-value">OBP OIDC</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Full Profile:</span>
        <span class="detail-value">{authInfo?.hasFullProfile ? "Yes" : "No"}</span>
      </div>
    </div>
  </details>
</div>

<style>
  .auth-status-container {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .user-avatar {
    margin-right: 1rem;
  }

  .avatar-circle {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-text {
    color: white;
    font-weight: bold;
    font-size: 1.25rem;
  }

  .user-details h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }

  .user-email {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
  }

  .status-success {
    background-color: #dcfce7;
    color: #166534;
  }

  .status-warning {
    background-color: #fef3c7;
    color: #92400e;
  }

  .status-icon {
    width: 1.25rem;
    height: 1.25rem;
    margin-right: 0.5rem;
  }

  .status-description {
    margin: 0 0 1rem 0;
    color: #4b5563;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .capabilities {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .capability-tag {
    padding: 0.25rem 0.75rem;
    background-color: #eff6ff;
    color: #1e40af;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .capability-tag.limited {
    background-color: #fef3c7;
    color: #92400e;
  }

  .warning-message {
    display: flex;
    padding: 1rem;
    background-color: #fffbeb;
    border: 1px solid #fed7aa;
    border-radius: 6px;
    margin-top: 1rem;
  }

  .warning-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: #d97706;
    margin-right: 0.75rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .warning-content strong {
    color: #92400e;
    font-weight: 600;
    display: block;
    margin-bottom: 0.25rem;
  }

  .warning-content p {
    margin: 0;
    color: #92400e;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .connection-details {
    margin-top: 1.5rem;
    border-top: 1px solid #f3f4f6;
    padding-top: 1rem;
  }

  .details-summary {
    cursor: pointer;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
    padding: 0.5rem 0;
    user-select: none;
  }

  .details-summary:hover {
    color: #1f2937;
  }

  .details-content {
    margin-top: 0.5rem;
    padding-left: 1rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 0.375rem 0;
    border-bottom: 1px solid #f9fafb;
    font-size: 0.875rem;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-label {
    font-weight: 500;
    color: #6b7280;
  }

  .detail-value {
    color: #1f2937;
    text-align: right;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .auth-status-container {
      padding: 1rem;
    }

    .user-info {
      flex-direction: column;
      text-align: center;
    }

    .user-avatar {
      margin-right: 0;
      margin-bottom: 1rem;
    }

    .capabilities {
      justify-content: center;
    }

    .detail-row {
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-value {
      text-align: left;
    }
  }
</style>
