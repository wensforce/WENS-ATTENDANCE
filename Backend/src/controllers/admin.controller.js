import prisma from "../../lib/prisma.js";
import { responses, success } from "../utils/response.js";
import bcrypt from "bcryptjs";
import { generatePinResetEmail, generateWelcomeEmail, sendEmail } from "../services/mail.service.js";

export const registerEmployee = async (req, res) => {
  try {
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
    } = req.body;
    // Check if user already exists
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
      },
    });

    const mailContent = generateWelcomeEmail(user.employeeName, user.mobileNumber, tempPin);
    await sendEmail(
      user.email,
      "Welcome to WENS FORCE - Your Account Details",
      mailContent,
    );

    return responses.created(res, {
      email: user.email,
      employeeName: user.employeeName,
      mobileNumber: user.mobileNumber,
      employeeId: user.employeeId,
      departmentId: user.departmentId,
      designationId: user.designationId,
      userType: user.userType,
      shift: user.shift,
      workLocation: user.workLocation,
      weekendOff: user.weekendOff,
      pin: tempPin, // In real application, you would send this via email/SMS instead of returning in response
    });
  } catch (error) {
    console.error("Registration error:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
  
    let [employees, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { employeeName: { contains: search } },
            { email: { contains: search } },
            { mobileNumber: { contains: search } },
            { employeeId: { contains: search } },
          ],
        },
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
        },
      }),
      prisma.user.count(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    employees = employees.map((emp) => {
      return {
        ...emp,
        department: emp.department ? emp.department.name : null,
        designation: emp.designation ? emp.designation.name : null,
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
    const { id } = req.params;
    const employee = await prisma.user.findUnique({
      where: { id: parseInt(id) },
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
    const { id } = req.params;
    const {
      employeeName,
      departmentId,
      designationId,
      shift,
      workLocation,
      weekendOff,
    } = req.body;
    const employee = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        employeeName,
        departmentId: Number(departmentId),
        designationId: Number(designationId),
        shift,
        workLocation,
        weekendOff,
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
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

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
    const { email, mobileNumber } = req.body;
    // Find user by email or mobile number
    const user = await prisma.user.findFirst({
      where: {
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
