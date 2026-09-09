import prisma from "../../lib/prisma.js";
import { responses, success } from "../utils/response.js";
import bcrypt from "bcryptjs";
import {
  generatePinResetEmail,
  generateWelcomeEmail,
  sendEmail,
} from "../services/mail.service.js";
import { sendWebhooks } from "../utils/webhook.js";
import { requireTenantId, isBodyguardEnabledForTenant } from "../utils/tenant.js";

export const registerEmployee = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const {
      email,
      employeeName,
      mobileNumber,
      employeeId,
      departmentId,
      designationId,
      userType,
      shift,
      workLocation,
      weekendOff,
      joinDate,
    } = req.body;
    // Email/mobile are unique across the whole app
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { mobileNumber: mobileNumber }],
      },
    });
    if (existingUser) {
      return responses.conflict(
        res,
        "User with this email or mobile number already exists",
      );
    }

    const [department, designation] = await Promise.all([
      prisma.department.findFirst({
        where: { id: Number(departmentId), tenantId },
      }),
      prisma.designation.findFirst({
        where: { id: Number(designationId), tenantId },
      }),
    ]);
    if (!department || !designation) {
      return responses.badRequest(
        res,
        "Invalid department or designation for this company",
      );
    }

    if (userType === "BODYGUARD") {
      const bodyguardEnabled = await isBodyguardEnabledForTenant(tenantId);
      if (!bodyguardEnabled) {
        return responses.badRequest(
          res,
          "Bodyguard service is not enabled for this company",
        );
      }
    }

    // Generate a temporary PIN or token for resetting the PIN 4 digits
    const tempPin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(tempPin, 10);
    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        mobileNumber,
        employeeId,
        employeeName,
        departmentId: Number(departmentId),
        designationId: Number(designationId),
        shift,
        workLocation,
        weekendOff,
        userType: userType,
        pin: hashedPin,
        joinDate: joinDate,
        tenantId,
      },
    });

    const mailContent = generateWelcomeEmail(
      user.employeeName,
      user.mobileNumber,
      tempPin,
    );

    sendWebhooks(
      "user_registered",
      {
        email: user.email,
        employeeName: user.employeeName,
        mobileNumber: user.mobileNumber,
        employeeId: user.employeeId,
        departmentId: user.departmentId,
        designationId: user.designationId,
        userType: user.userType,
        shift: user?.shift,
        skipLocationCheck: user?.skipLocationCheck,
        workLocation: user.workLocation,
        weekendOff: user.weekendOff,
      },
      tenantId,
    );

    return responses.created(res, {
      email: user.email,
      employeeName: user.employeeName,
      mobileNumber: user.mobileNumber,
      employeeId: user.employeeId,
      departmentId: user.departmentId,
      designationId: user.designationId,
      userType: user.userType,
      shift: user?.shift,
      workLocation: user?.workLocation,
      weekendOff: user?.weekendOff,
      pin: tempPin, // In real application, you would send this via email/SMS instead of returning in response
    });

    await sendEmail(
      user.email,
      "Welcome to WENS FORCE - Your Account Details",
      mailContent,
    );
  } catch (error) {
    // employee id already exists
    if (error.code === "P2003" && error.meta.target.includes("employeeId")) {
      return responses.conflict(res, "Employee ID already exists");
    }
    console.error("Registration error:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(search
        ? {
            OR: [
              { employeeName: { contains: search } },
              { email: { contains: search } },
              { mobileNumber: { contains: search } },
              { employeeId: { contains: search } },
            ],
          }
        : {}),
    };

    let [employees, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          employeeName: true,
          email: true,
          mobileNumber: true,
          employeeId: true,
          department: true,
          designation: true,
          workLocation: true,
          weekendOff: true,
          shift: true,
          userType: true,
          joinDate: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    employees = employees.map((emp) => {
      return {
        ...emp,
        department: emp.department ? emp.department.name : null,
        designation: emp.designation ? emp.designation.name : null,
        departmentId: emp.department?.id ?? null,
        designationId: emp.designation?.id ?? null,
      };
    });

    return success(res, 200, "Employees retrieved successfully", {
      employees,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get employees error:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const employee = await prisma.user.findFirst({
      where: { id: parseInt(id), tenantId },
      select: {
        id: true,
        employeeName: true,
        email: true,
        mobileNumber: true,
        employeeId: true,
        department: true,
        designation: true,
        workLocation: true,
        weekendOff: true,
        shift: true,
        userType: true,
        skipLocationCheck: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!employee) {
      return responses.notFound(res, "Employee not found");
    }
    return success(res, 200, "Employee retrieved successfully", { employee });
  } catch (error) {
    console.error("Get employee by ID error:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const {
      employeeName,
      departmentId,
      designationId,
      shift,
      workLocation,
      weekendOff,
      joinDate,
    } = req.body;

    const existing = await prisma.user.findFirst({
      where: { id: parseInt(id), tenantId },
    });
    if (!existing) {
      return responses.notFound(res, "Employee not found");
    }

    if (departmentId || designationId) {
      const [department, designation] = await Promise.all([
        departmentId
          ? prisma.department.findFirst({
              where: { id: Number(departmentId), tenantId },
            })
          : Promise.resolve(true),
        designationId
          ? prisma.designation.findFirst({
              where: { id: Number(designationId), tenantId },
            })
          : Promise.resolve(true),
      ]);
      if (!department || !designation) {
        return responses.badRequest(
          res,
          "Invalid department or designation for this company",
        );
      }
    }

    const employee = await prisma.user.update({
      where: { id: existing.id },
      data: {
        employeeName,
        departmentId: Number(departmentId),
        designationId: Number(designationId),
        shift,
        workLocation,
        weekendOff,
        joinDate,
      },
    });
    return responses.updated(res, employee);
  } catch (error) {
    console.error("Update employee error:", error);
    if (error.code === "P2025") {
      return responses.notFound(res, "Employee not found");
    }
    responses.serverError(res, "Internal server error");
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;

    const deleted = await prisma.user.deleteMany({
      where: { id: parseInt(id), tenantId },
    });
    if (deleted.count === 0) {
      return responses.notFound(res, "Employee not found or already deleted");
    }

    return responses.deleted(res);
  } catch (error) {
    console.error("Delete employee error:", error);

    // P2025 is Prisma's error code for "Record not found"
    if (error.code === "P2025") {
      return responses.notFound(res, "Employee not found or already deleted");
    }

    responses.serverError(res, "Internal server error");
  }
};

export const resetPin = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { email, mobileNumber } = req.body;
    // Find user by email or mobile number within this company
    const user = await prisma.user.findFirst({
      where: {
        tenantId,
        OR: [{ email: email }, { mobileNumber: mobileNumber }],
      },
    });
    if (!user) {
      return responses.notFound(res, "User not found");
    }
    // Generate a temporary PIN or token for resetting the PIN 4 digits
    const tempPin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedTempPin = await bcrypt.hash(tempPin, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { pin: hashedTempPin },
    });
    // send email with the temporary PIN
    const mailContent = generatePinResetEmail(user.employeeName, tempPin);
    await sendEmail(user.email, "PIN Reset", mailContent);
    return success(res, 200, "PIN has been sent", { tempPin });
  } catch (error) {
    console.error("Forgot PIN error:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const toggleSkipLocationCheck = async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    const { skipLocationCheck } = req.body;
    if (typeof skipLocationCheck !== "boolean") {
      return responses.badRequest(res, "skipLocationCheck must be a boolean");
    }
    const updated = await prisma.user.updateMany({
      where: { id: parseInt(id), tenantId },
      data: { skipLocationCheck },
    });
    if (updated.count === 0) {
      return responses.notFound(res, "Employee not found");
    }
    return success(res, 200, "Skip location check updated successfully", {
      skipLocationCheck,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return responses.notFound(res, "Employee not found");
    }
    console.error("Toggle skip location check error:", error);
    responses.serverError(res, "Internal server error");
  }
};
