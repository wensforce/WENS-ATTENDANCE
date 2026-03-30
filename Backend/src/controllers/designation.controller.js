import prisma from "../../lib/prisma.js";
import { responses, success } from "../utils/response.js";

export const createDesignation = async (req, res) => {
  try {
    const { name } = req.body;
    const existingDesignation = await prisma.designation.findUnique({
      where: { name },
    });
    if (existingDesignation) {
      return responses.conflict(res, "Designation already exists");
    }
    const designation = await prisma.designation.create({
      data: { name },
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
    const designations = await prisma.designation.findMany();
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
    const { id } = req.params;
    const designation = await prisma.designation.findUnique({
      where: { id: parseInt(id) },
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
    const { id } = req.params;
    const { name } = req.body;
    const existingDesignation = await prisma.designation.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingDesignation) {
      return responses.notFound(res, "Designation not found");
    }
    const updatedDesignation = await prisma.designation.update({
      where: { id: parseInt(id) },
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
    const { id } = req.params;
    const existingDesignation = await prisma.designation.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingDesignation) {
      return responses.notFound(res, "Designation not found");
    }
    await prisma.designation.delete({
      where: { id: parseInt(id) },
    });
    return success(res, 200, "Designation deleted successfully");
  } catch (error) {
    console.error("Delete designation error:", error);
    return responses.serverError(res, "Internal server error");
  }
};
