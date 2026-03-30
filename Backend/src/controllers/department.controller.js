import prisma from "../../lib/prisma.js";
import { responses, success } from "../utils/response.js";

export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    const existingDepartment = await prisma.department.findUnique({
      where: { name },
    });
    if (existingDepartment) {
      return responses.conflict(
        res,
        "Department with this name already exists",
      );
    }
    const department = await prisma.department.create({
      data: { name },
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
    const departments = await prisma.department.findMany();
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
    const { id } = req.params;
    const department = await prisma.department.findUnique({
      where: { id: parseInt(id) },
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
    const { id } = req.params;
    const { name } = req.body;
    const existingDepartment = await prisma.department.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingDepartment) {
      return responses.notFound(res, "Department not found");
    }
    const updatedDepartment = await prisma.department.update({
      where: { id: parseInt(id) },
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
    const { id } = req.params;
    const existingDepartment = await prisma.department.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingDepartment) {
      return responses.notFound(res, "Department not found");
    }
    await prisma.department.delete({
      where: { id: parseInt(id) },
    });
    return responses.deleted(res);
  } catch (error) {
    console.error("Delete department error:", error);
    return responses.serverError(res, "Internal server error");
  }
};
