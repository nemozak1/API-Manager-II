import {
  oauth2ProviderManager,
  type ProviderStatus,
} from "$lib/oauth/providerManager";
import { redirect } from "@sveltejs/kit";
import type { ServerLoad } from "@sveltejs/kit";
import { PUBLIC_OBP_BASE_URL } from "$env/static/public";
import { env } from "$env/dynamic/private";

export const load: ServerLoad = async ({ url }) => {
  const errorMessage = url.searchParams.get("error");
  const allProviders = oauth2ProviderManager.getAllProviders();
  const availableProviders = oauth2ProviderManager.getAvailableProviders();
  const unavailableProviders = oauth2ProviderManager.getUnavailableProviders();

  // If we have exactly 1 available provider, redirect directly to it
  if (availableProviders.length === 1) {
    throw redirect(302, `/login/${availableProviders[0].provider}`);
  }

  // Gather diagnostic information
  const diagnosticInfo = {
    obpApiUrl: PUBLIC_OBP_BASE_URL || "NOT_CONFIGURED",
    wellKnownEndpoint: `${PUBLIC_OBP_BASE_URL}/obp/v5.1.0/well-known`,
    configuredProviders: oauth2ProviderManager.getSupportedProviders?.() || [],
    totalProviders: allProviders.length,
    availableCount: availableProviders.length,
    unavailableCount: unavailableProviders.length,
    managerReady: oauth2ProviderManager.isReady?.() || false,
  };

  // Return all providers for user selection (0, 2+ available providers)
  return {
    allProviders,
    availableProviders,
    unavailableProviders,
    loading: false,
    lastUpdated: new Date().toISOString(),
    errorMessage,
    diagnosticInfo,
  };
};
