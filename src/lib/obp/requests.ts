import { createLogger } from "$lib/utils/logger";
const logger = createLogger("OBPRequests");
import { env } from "$env/dynamic/public";
import { OBPErrorBase, OBPRequestError } from "$lib/obp/errors";

class OBPRequests {
  base_url: string;

  constructor(base_url: string) {
    logger.info("Initializing with base URL:", base_url);

    if (!base_url) {
      throw new OBPErrorBase("Base URL for OBP requests is not defined.");
    }
    this.base_url = base_url;

    logger.info("Initialized.");
  }

  async get(endpoint: string, accessToken?: string): Promise<any> {
    // Enhanced logging for metrics API debugging
    const isMetricsCall = endpoint.includes("/management/metrics");

    if (isMetricsCall) {
      logger.info("🔍 OBP METRICS API CALL START");
      logger.info(`  Full URL: ${this.base_url}${endpoint}`);
      logger.info(`  Endpoint: ${endpoint}`);
      logger.info(`  Access token provided: ${!!accessToken}`);
      if (accessToken) {
        logger.info(`  Token preview: ${accessToken.substring(0, 30)}...`);
        logger.info(`  Token length: ${accessToken.length}`);
      }
    } else {
      logger.debug("GET", endpoint);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    if (isMetricsCall) {
      logger.info(`  Request headers: ${JSON.stringify(headers, null, 2)}`);
    }

    const response = await fetch(`${this.base_url}${endpoint}`, {
      headers,
    });

    if (isMetricsCall) {
      logger.info("🔍 OBP METRICS API RESPONSE");
      logger.info(`  HTTP Status: ${response.status}`);
      logger.info(`  Status Text: ${response.statusText}`);
      logger.info(`  Response OK: ${response.ok}`);
      logger.info(
        `  Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`,
      );
    }

    const data = await response.json();

    if (!response.ok) {
      if (isMetricsCall) {
        logger.error("🚨 METRICS API ERROR RESPONSE");
        logger.error(`  Status: ${response.status} ${response.statusText}`);
        logger.error(`  Error data: ${JSON.stringify(data, null, 2)}`);
      } else {
        logger.error("Failed to fetch OBP data:", {
          statusText: response.statusText,
          data,
        });
      }

      if (data && data.code && data.message) {
        throw new OBPRequestError(data.code, data.message);
      } else {
        throw new OBPErrorBase(
          `Error fetching OBP data: ${response.statusText}`,
        );
      }
    }

    if (isMetricsCall) {
      logger.info("🔍 METRICS API SUCCESS RESPONSE");
      logger.info(`  Response type: ${typeof data}`);
      logger.info(`  Response is array: ${Array.isArray(data)}`);
      logger.info(`  Response keys: ${data ? Object.keys(data) : "null"}`);
      logger.info(`  Has metrics property: ${data?.hasOwnProperty("metrics")}`);
      if (data?.metrics) {
        logger.info(
          `  Metrics count: ${Array.isArray(data.metrics) ? data.metrics.length : "not array"}`,
        );
        if (Array.isArray(data.metrics) && data.metrics.length > 0) {
          logger.info(`  First metric keys: ${Object.keys(data.metrics[0])}`);
          logger.info(
            `  Sample metric: ${JSON.stringify(data.metrics[0], null, 2)}`,
          );
        }
      }
      logger.info(
        `  Full response structure: ${JSON.stringify(data, null, 2)}`,
      );
      logger.info("🔍 METRICS API CALL END");
    } else {
      logger.debug("Response from OBP", response.status, response.statusText);
      logger.debug("GET done");
    }

    return data;
  }

  async post(endpoint: string, body: any, accessToken?: string): Promise<any> {
    logger.debug("POST", endpoint, body);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const response = await fetch(`${this.base_url}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Failed to post OBP data:", {
        statusText: response.statusText,
        data,
      });

      if (data && data.code && data.message) {
        throw new OBPRequestError(data.code, data.message);
      } else {
        throw new OBPErrorBase(
          `Error posting OBP data: ${response.statusText}`,
        );
      }
    }

    logger.debug("Response from OBP", response.status, response.statusText);
    logger.debug("POST done");
    return data;
  }

  async delete(endpoint: string, accessToken?: string): Promise<any> {
    logger.debug("DELETE", endpoint);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const response = await fetch(`${this.base_url}${endpoint}`, {
      method: "DELETE",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Failed to delete OBP data:", response.statusText, data);
      if (data && data.code && data.message) {
        throw new OBPRequestError(data.code, data.message);
      } else {
        throw new OBPErrorBase(
          `Error deleting OBP data: ${response.statusText}`,
        );
      }
    }

    logger.debug("Response from OBP", response.status, response.statusText);
    logger.debug("DELETE done");
    return data;
  }

  async put(endpoint: string, body: any, accessToken?: string): Promise<any> {
    logger.debug("PUT", endpoint, body);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const response = await fetch(`${this.base_url}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Failed to put OBP data:", {
        statusText: response.statusText,
        data,
      });
      if (data && data.code && data.message) {
        throw new OBPRequestError(data.code, data.message);
      } else {
        throw new OBPErrorBase(
          `Error putting OBP data: ${response.statusText}`,
        );
      }
    }

    logger.debug("Response from OBP", response.status, response.statusText);
    logger.debug("PUT done");
    return data;
  }

  async patch(endpoint: string, body: any, accessToken?: string): Promise<any> {
    logger.debug("PATCH", endpoint, body);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const response = await fetch(`${this.base_url}${endpoint}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Failed to patch OBP data:", {
        statusText: response.statusText,
        data,
      });
      if (data && data.code && data.message) {
        throw new OBPRequestError(data.code, data.message);
      } else {
        throw new OBPErrorBase(
          `Error patching OBP data: ${response.statusText}`,
        );
      }
    }

    logger.debug("Response from OBP", response.status, response.statusText);
    logger.debug("PATCH done");
    return data;
  }
}

let obp_requests_instance: OBPRequests | null = null;

export const obp_requests = {
  get instance(): OBPRequests {
    if (!obp_requests_instance) {
      obp_requests_instance = new OBPRequests(env.PUBLIC_OBP_BASE_URL);
    }
    return obp_requests_instance;
  },

  get: function (endpoint: string, accessToken?: string) {
    return this.instance.get(endpoint, accessToken);
  },

  post: function (endpoint: string, data: any, accessToken?: string) {
    return this.instance.post(endpoint, data, accessToken);
  },

  put: function (endpoint: string, data: any, accessToken?: string) {
    return this.instance.put(endpoint, data, accessToken);
  },

  delete: function (endpoint: string, accessToken?: string) {
    return this.instance.delete(endpoint, accessToken);
  },
};
