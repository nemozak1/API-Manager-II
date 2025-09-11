import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

interface MetricsData {
  totalUsers: number;
  totalBanks: number;
  totalAccounts: number;
  totalTransactions: number;
  apiCalls: number;
  activeConnections: number;
}

interface ApiMetricsData {
  responseTime: number;
  errorRate: number;
  throughput: number;
  availability: number;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // For now, return simulated metrics to get the page working
  const metrics = getDefaultMetrics();
  const apiMetrics = getDefaultApiMetrics();

  // Check if we have API access based on authInfo
  const hasApiAccess = session.data.authInfo?.source === "obp_api";

  return {
    metrics,
    apiMetrics,
    hasApiAccess,
    lastUpdated: new Date().toISOString(),
    error: hasApiAccess
      ? null
      : "Using fallback authentication - limited API access",
  };
};

function getDefaultApiMetrics(): ApiMetricsData {
  return {
    responseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
    errorRate: Math.random() * 5, // 0-5%
    throughput: Math.floor(Math.random() * 1000) + 100, // requests/min
    availability: 99.9,
  };
}

function getDefaultMetrics(): MetricsData {
  return {
    totalUsers: 1,
    totalBanks: Math.floor(Math.random() * 5) + 1, // 1-5 banks
    totalAccounts: Math.floor(Math.random() * 50) + 10, // 10-59 accounts
    totalTransactions: Math.floor(Math.random() * 5000) + 1000, // 1000-5999 transactions
    apiCalls: Math.floor(Math.random() * 10000) + 1000, // 1000-10999 API calls
    activeConnections: 1,
  };
}

// Helper function to get time series data for charts
function getTimeSeriesData() {
  const now = new Date();
  const data = [];

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toISOString(),
      apiCalls: Math.floor(Math.random() * 100) + 20,
      responseTime: Math.floor(Math.random() * 200) + 50,
      errors: Math.floor(Math.random() * 10),
    });
  }

  return data;
}
