import { error, responses, success } from "../utils/response.js";
import prisma from "../../lib/prisma.js";

export const saveDeviceToken = async (req, res) => {
  try {
    const { deviceToken } = req.body;
    const userId = req.user.userId;

    if (!deviceToken) {
      return error(res, 400, "Device token is required");
    }

    if (deviceToken === req.user.deviceId) {
      return success(res, 200, "Device token is already up to date");
    }

    // Save the device token logic here
    // For example, update the user's device token in the database
    await prisma.user.update({
      where: { id: userId },
      data: { deviceId: deviceToken },
    });

    return success(res, 200, "Device token saved successfully");
  } catch (error) {
    console.error("Error saving device token:", error);
    return responses.serverError(res, 500, "Internal server error");
  }
};

