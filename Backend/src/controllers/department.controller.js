import prisma from "../../lib/prisma.js";
import { responses, success } from "../utils/response.js";
import { requireTenantId } from "../utils/tenant.js";

export const createDepartment = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { name } = req.body;
    const existingDepartment = await prisma.department.findFirst({
      where: { tenantId, name },
    });
    if (existingDepartment) {
      return responses.conflict(
        res,
        "Department with this name already exists",
      );
    }
    const department = await prisma.department.create({
      data: { name, tenantId },
    });
    return responses.created(res, {
      department,
    });
  } catch (error) {
    console.error("Create department error:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const getDepartments = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const departments = await prisma.department.findMany({
      where: { tenantId },
    });
    return success(res, 200, "Departments retrieved successfully", {
      departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const department = await prisma.department.findFirst({
      where: { id: parseInt(id), tenantId },
    });
    if (!department) {
      return responses.notFound(res, "Department not found");
    }
    return success(res, 200, "Department retrieved successfully", {
      department,
    });
  } catch (error) {
    console.error("Get department by ID error:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const { name } = req.body;
    const existingDepartment = await prisma.department.findFirst({
      where: { id: parseInt(id), tenantId },
    });
    if (!existingDepartment) {
      return responses.notFound(res, "Department not found");
    }

    const nameTaken = await prisma.department.findFirst({
      where: {
        tenantId,
        name,
        NOT: { id: existingDepartment.id },
      },
    });
    if (nameTaken) {
      return responses.conflict(
        res,
        "Department with this name already exists",
      );
    }

    const updatedDepartment = await prisma.department.update({
      where: { id: existingDepartment.id },
      data: { name },
    });
    return responses.updated(res, {
      department: updatedDepartment,
    });
  } catch (error) {
    console.error("Update department error:", error);
    return responses.serverError(res, "Internal server error");
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const deleted = await prisma.department.deleteMany({
      where: { id: parseInt(id), tenantId },
    });
    if (deleted.count === 0) {
      return responses.notFound(res, "Department not found");
    }
    return responses.deleted(res);
  } catch (error) {
    console.error("Delete department error:", error);
    return responses.serverError(res, "Internal server error");
  }
};
