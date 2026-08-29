import prisma from "../../lib/prisma.js";
import { responses, success, error } from "../utils/response.js";

export const getAttendanceSetting = async (req, res) => {
  try {
    // find latest attendance setting
    let attendanceSetting = await prisma.attendanceSetting.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });
    if (!attendanceSetting) {
      attendanceSetting = await prisma.attendanceSetting.create({ data: {} });
    }
    return success(
      res,
      200,
      "Attendance setting fetched successfully",
      attendanceSetting,
    );
  } catch (error) {
    return responses.serverError(res, "Internal server error");
  }
};

export const updateAttendanceSetting = async (req, res) => {
  try {
    const id = Number(req.params?.id);
    if (!id || Number.isNaN(id)) {
      return error(res, 400, "Valid attendance setting ID is required");
    }

    const lateBufferMinutes = Number(req.body?.lateBufferMinutes);
    const checkInRadius = Number(req.body?.checkInRadius);

    if (!Number.isInteger(lateBufferMinutes) || lateBufferMinutes < 0) {
      return error(res, 400, "Late buffer minutes must be a positive number");
    }
    if (!Number.isInteger(checkInRadius) || checkInRadius <= 0) {
      return error(res, 400, "Check in radius must be a positive number");
    }

    const attendanceSetting = await prisma.attendanceSetting.update({
      where: { id },
      data: { lateBufferMinutes, checkInRadius },
    });
    return success(
      res,
      200,
      "Attendance setting updated successfully",
      attendanceSetting,
    );
  } catch (error) {
    return responses.serverError(res, "Internal server error");
  }
};
