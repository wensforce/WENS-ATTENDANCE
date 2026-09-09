import prisma from "../../lib/prisma.js";
import { responses, success } from "../utils/response.js";
import { requireTenantId } from "../utils/tenant.js";

export const createDesignation = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { name } = req.body;
    const existingDesignation = await prisma.designation.findFirst({
      where: { tenantId, name },
    });
    if (existingDesignation) {
      return responses.conflict(res, "Designation already exists");
    }
    const designation = await prisma.designation.create({
      data: { name, tenantId },
    });
    return responses.created(res, {
      designation,
    });
  } catch (error) {
    console.error("Create designation error:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const getDesignations = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const designations = await prisma.designation.findMany({
      where: { tenantId },
    });
    return success(res, 200, "Designations retrieved successfully", {
      designations,
    });
  } catch (error) {
    console.error("Get designations error:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const getDesignationById = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const designation = await prisma.designation.findFirst({
      where: { id: parseInt(id), tenantId },
    });
    if (!designation) {
      return responses.notFound(res, "Designation not found");
    }
    return success(res, 200, "Designation retrieved successfully", {
      designation,
    });
  } catch (error) {
    console.error("Get designation by ID error:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const updateDesignation = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const { name } = req.body;
    const existingDesignation = await prisma.designation.findFirst({
      where: { id: parseInt(id), tenantId },
    });
    if (!existingDesignation) {
      return responses.notFound(res, "Designation not found");
    }

    const nameTaken = await prisma.designation.findFirst({
      where: {
        tenantId,
        name,
        NOT: { id: existingDesignation.id },
      },
    });
    if (nameTaken) {
      return responses.conflict(res, "Designation already exists");
    }

    const updatedDesignation = await prisma.designation.update({
      where: { id: existingDesignation.id },
      data: { name },
    });
    return success(res, 200, "Designation updated successfully", {
      designation: updatedDesignation,
    });
  } catch (error) {
    console.error("Update designation error:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const deleteDesignation = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const deleted = await prisma.designation.deleteMany({
      where: { id: parseInt(id), tenantId },
    });
    if (deleted.count === 0) {
      return responses.notFound(res, "Designation not found");
    }
    return success(res, 200, "Designation deleted successfully");
  } catch (error) {
    console.error("Delete designation error:", error);
    return responses.serverError(res, "Internal server error");
  }
};
