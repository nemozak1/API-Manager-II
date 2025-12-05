import { json } from "@sveltejs/kit";
import { obp_requests } from "$lib/obp/requests";
import type { RequestHandler } from "./$types";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("WebUIPropsAPI");

export const POST: RequestHandler = async ({ request, locals }) => {
  logger.info("=== POST /api/webui-props - Create WebUI Prop ===");

  const token = locals.session.data.oauth?.access_token;
  if (!token) {
    logger.error("No access token found");
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("Access token present");

  try {
    const body = await request.json();
    logger.info("Request body received:", JSON.stringify(body));

    // Validate required fields
    if (!body.name || !body.value) {
      logger.warn("Validation failed: name or value missing");
      return json({ error: "Name and value are required" }, { status: 400 });
    }

    const requestBody = {
      name: body.name,
      value: body.value,
      description: body.description || "",
      is_active: body.is_active !== undefined ? body.is_active : true,
    };

    logger.info("Creating webui prop with data:", JSON.stringify(requestBody));
    logger.info("Calling OBP API: POST /obp/v3.1.0/management/webui_props");

    const response = await obp_requests.post(
      "/obp/v3.1.0/management/webui_props",
      requestBody,
      token,
    );

    logger.info("WebUI prop created successfully:", JSON.stringify(response));

    return json(response, { status: 201 });
  } catch (error: any) {
    logger.error("=== Error creating webui prop ===");
    logger.error("Error message:", error?.message);
    logger.error("Error status:", error?.status);
    logger.error("Error statusText:", error?.statusText);
    logger.error("Error response:", JSON.stringify(error?.response));
    logger.error("Full error object:", JSON.stringify(error, null, 2));

    const errorMessage = error?.message || "Failed to create webui prop";
    const statusCode = error?.status || 500;

    // Extract more detailed error information
    const errorDetails = error?.response?.data || error?.data || error;

    logger.error("Returning error to client:", {
      message: errorMessage,
      status: statusCode,
      details: errorDetails,
    });

    return json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: statusCode },
    );
  }
};
