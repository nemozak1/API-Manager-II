import { json } from "@sveltejs/kit";
import { obp_requests } from "$lib/obp/requests";
import type { RequestHandler } from "./$types";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("WebUIPropsAPI");

export const PUT: RequestHandler = async ({ request, locals, params }) => {
  const token = locals.session.data.oauth?.access_token;
  if (!token) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.value) {
      return json({ error: "Name and value are required" }, { status: 400 });
    }

    const requestBody = {
      name: body.name,
      value: body.value,
      description: body.description || "",
      is_active: body.is_active !== undefined ? body.is_active : true,
    };

    logger.debug(`Updating webui prop ${id}:`, requestBody);

    const response = await obp_requests.put(
      `/obp/v3.1.0/management/webui_props/${id}`,
      requestBody,
      token,
    );

    logger.debug("WebUI prop updated successfully:", response);

    return json(response, { status: 200 });
  } catch (error: any) {
    logger.error(`Error updating webui prop ${id}:`, error);

    const errorMessage = error?.message || "Failed to update webui prop";
    const statusCode = error?.status || 500;

    return json(
      {
        error: errorMessage,
        details: error?.response?.data || error,
      },
      { status: statusCode },
    );
  }
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  const token = locals.session.data.oauth?.access_token;
  if (!token) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    logger.debug(`Deleting webui prop ${id}`);

    await obp_requests.delete(
      `/obp/v3.1.0/management/webui_props/${id}`,
      token,
    );

    logger.debug(`WebUI prop ${id} deleted successfully`);

    return json({ success: true }, { status: 200 });
  } catch (error: any) {
    logger.error(`Error deleting webui prop ${id}:`, error);

    const errorMessage = error?.message || "Failed to delete webui prop";
    const statusCode = error?.status || 500;

    return json(
      {
        error: errorMessage,
        details: error?.response?.data || error,
      },
      { status: statusCode },
    );
  }
};
