import { createLogger } from "$lib/utils/logger";
const logger = createLogger("OBPLoginCallback");
import { oauth2ProviderFactory } from "$lib/oauth/providerFactory";
import type { OAuth2Tokens } from "arctic";
import type { RequestEvent } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/public";

export async function GET(event: RequestEvent): Promise<Response> {
  const storedState = event.cookies.get("obp_oauth_state");
  const code = event.url.searchParams.get("code");
  const recievedState = event.url.searchParams.get("state");

  if (storedState === null || code === null || recievedState === null) {
    throw error(400, "Please restart the process.");
  }
  if (storedState !== recievedState) {
    logger.warn("State mismatch:", storedState, recievedState);
    // State does not match, likely a CSRF attack or user error
    throw error(400, "Please restart the process.");
  }

  const [actualState, provider] = storedState.split(":");
  logger.debug("Received state:", recievedState);
  if (!provider) {
    throw error(400, "Invalid state format");
  }

  const oauthClient = oauth2ProviderFactory.getClient(provider);
  if (!oauthClient) {
    logger.error(`OAuth client for provider "${provider}" not found.`);
    throw error(400, "Invalid OAuth provider");
  }

  // Validate the authorization code and exchange it for tokens
  const token_endpoint = oauthClient.OIDCConfig?.token_endpoint;
  if (!token_endpoint) {
    logger.error("Token endpoint not found in OIDC configuration.");
    throw error(500, "OAuth configuration error");
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await oauthClient.validateAuthorizationCode(
      token_endpoint,
      code,
      null,
    );
  } catch (e) {
    logger.error("Error validating authorization code:", e);
    throw error(400, "Log in failed, please restart the process.");
  }

  // Get rid of the state cookie
  event.cookies.delete("obp_oauth_state", {
    path: "/",
  });

  const obpAccessToken = tokens.accessToken();

  // Try to fetch user info from OBP API first
  logger.debug(`PUBLIC_OBP_BASE_URL from env: ${env.PUBLIC_OBP_BASE_URL}`);
  const currentUserUrl = `${env.PUBLIC_OBP_BASE_URL}/obp/v5.1.0/users/current`;
  logger.info("Fetching current user from OBP API:", currentUserUrl);

  const obpUserRequest = new Request(currentUserUrl);
  obpUserRequest.headers.set("Authorization", `Bearer ${obpAccessToken}`);
  logger.debug("Making OBP API current user request with access token");

  const obpUserResponse = await fetch(obpUserRequest);

  if (obpUserResponse.ok) {
    // Successfully got user data from OBP API
    const user = await obpUserResponse.json();
    logger.info(
      `Successfully fetched current user from OBP API - User ID: ${user.user_id}, Email: ${user.email}, Username: ${user.username || "N/A"}`,
    );
    logger.debug("Full OBP user data:", user);

    if (user.user_id && user.email) {
      // Store user data in session
      const { session } = event.locals;
      await session.setData({
        user: user,
        oauth: {
          access_token: obpAccessToken,
          refresh_token: tokens.refreshToken(),
          provider: provider,
        },
        authInfo: {
          source: "obp_api",
          sourceDescription: "OBP API Server",
          hasFullProfile: true,
          capabilities: ["full_user_data", "api_access", "banking_data"],
        },
      });
      await session.save();
      logger.debug("Session data set:", session.data);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/`,
        },
      });
    } else {
      logger.error(
        "Invalid user data received from OBP API - missing user_id or email",
      );
      throw error(400, "Authentication failed - invalid user data");
    }
  } else {
    // Fallback to OIDC userinfo endpoint
    const errorText = await obpUserResponse.text();
    logger.warn(
      `OBP API current user request failed - Status: ${obpUserResponse.status}, Response: ${errorText}`,
    );
    logger.info("Falling back to OIDC userinfo endpoint");

    const userInfoEndpoint = oauthClient.OIDCConfig?.userinfo_endpoint;
    if (!userInfoEndpoint) {
      logger.error("UserInfo endpoint not found in OIDC configuration.");
      throw error(500, "OAuth configuration error");
    }

    logger.info(
      "Fetching current user from OIDC userinfo endpoint:",
      userInfoEndpoint,
    );
    const oidcUserRequest = new Request(userInfoEndpoint);
    oidcUserRequest.headers.set("Authorization", `Bearer ${obpAccessToken}`);
    logger.debug("Making OIDC userinfo request with access token");

    const oidcUserResponse = await fetch(oidcUserRequest);
    if (!oidcUserResponse.ok) {
      const oidcErrorText = await oidcUserResponse.text();
      logger.error(
        `OIDC userinfo request failed - Status: ${oidcUserResponse.status}, Response: ${oidcErrorText}`,
      );
      throw error(
        500,
        "Failed to fetch current user from both OBP API and OIDC",
      );
    }

    const oidcUser = await oidcUserResponse.json();
    logger.info(
      `Successfully fetched current user from OIDC - Subject: ${oidcUser.sub}, Email: ${oidcUser.email || "N/A"}, Name: ${oidcUser.name || "N/A"}`,
    );
    logger.debug("Full OIDC user data:", oidcUser);

    if (oidcUser.sub) {
      // Store user data in session - map OIDC fields to expected format
      const { session } = event.locals;
      const userData = {
        user_id: oidcUser.sub,
        email: oidcUser.email || oidcUser.sub,
        username: oidcUser.name || oidcUser.preferred_username || oidcUser.sub,
      };

      await session.setData({
        user: userData,
        oauth: {
          access_token: obpAccessToken,
          refresh_token: tokens.refreshToken(),
          provider: provider,
        },
        authInfo: {
          source: "oidc_fallback",
          sourceDescription: "OIDC Provider (Fallback)",
          hasFullProfile: false,
          capabilities: ["basic_auth", "limited_profile"],
          warning: "Limited functionality - OBP API server not accessible",
        },
      });
      await session.save();
      logger.debug("Session data set:", session.data);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/`,
        },
      });
    } else {
      logger.error(
        "Invalid user data received from OIDC - missing subject (sub) claim",
      );
      throw error(400, "Authentication failed - invalid user data");
    }
  }
}
