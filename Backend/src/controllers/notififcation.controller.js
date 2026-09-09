import { error, responses, success } from "../utils/response.js";
import prisma from "../../lib/prisma.js";
import { requireTenantId } from "../utils/tenant.js";

export const saveDeviceToken = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { deviceToken } = req.body;
    const userId = req.user.userId;

    if (!deviceToken) {
      return error(res, 400, "Device token is required");
    }

    if (deviceToken === req.user.deviceId) {
      return success(res, 200, "Device token is already up to date");
    }

    const updated = await prisma.user.updateMany({
      where: { id: userId, tenantId },
      data: { deviceId: deviceToken },
    });
    if (updated.count === 0) {
      return responses.notFound(res, "User not found");
    }

    return success(res, 200, "Device token saved successfully");
  } catch (err) {
    console.error("Error saving device token:", err);
    return responses.serverError(res, 500, "Internal server error");
  }
};
