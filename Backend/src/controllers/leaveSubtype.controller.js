import prisma from "../../lib/prisma.js";
import { responses, success } from "../utils/response.js";
import { requireTenantId } from "../utils/tenant.js";

export const createLeaveSubType = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const type = req.body?.type?.trim();
    if (type !== "LEAVE" && type !== "HOLIDAY") return responses.badRequest(res, "Invalid type");
    const name = req.body?.name?.trim();
    if (!name) return responses.badRequest(res, "Name is required");

    const leaveSubType = await prisma.leaveSubType.create({
      data: { name, type, tenantId },
    });
    return responses.created(res, leaveSubType);
  } catch (error) {
    if (error.code === "P2002") {
      return responses.conflict(res, "Leave type already exists");
    }
    return responses.serverError(res, error.message);
  }
};

export const getAllLeaveSubTypes = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const type = req.query?.type?.trim();
    if (type && type !== "LEAVE" && type !== "HOLIDAY") {
      return responses.badRequest(res, "Invalid type");
    }
    const leaveSubTypes = await prisma.leaveSubType.findMany({
      where: type ? { tenantId, type } : { tenantId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    return success(res, 200, "Leave sub types fetched successfully", leaveSubTypes);
  } catch (error) {
    return responses.serverError(res, error.message);
  }
};

export const updateLeaveSubType = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const type = req.body?.type?.trim();
    if (type !== "LEAVE" && type !== "HOLIDAY") return responses.badRequest(res, "Invalid type");
    const name = req.body?.name?.trim();
    if (!name) return responses.badRequest(res, "Name is required");

    const existing = await prisma.leaveSubType.findFirst({
      where: { id: parseInt(id), tenantId },
    });
    if (!existing) {
      return responses.notFound(res, "Leave type not found");
    }

    const leaveSubType = await prisma.leaveSubType.update({
      where: { id: existing.id },
      data: { name, type },
    });
    return responses.updated(res, leaveSubType);
  } catch (error) {
    if (error.code === "P2002") {
      return responses.conflict(res, "Leave type already exists");
    }
    if (error.code === "P2025") {
      return responses.notFound(res, "Leave type not found");
    }
    return responses.serverError(res, error.message);
  }
};

export const deleteLeaveSubType = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const deleted = await prisma.leaveSubType.deleteMany({
      where: { id: parseInt(id), tenantId },
    });
    if (deleted.count === 0) {
      return responses.notFound(res, "Leave type not found");
    }
    return responses.deleted(res);
  } catch (error) {
    if (error.code === "P2025") {
      return responses.notFound(res, "Leave type not found");
    }
    return responses.serverError(res, error.message);
  }
};
