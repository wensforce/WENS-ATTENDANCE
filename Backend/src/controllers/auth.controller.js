import prisma from "../../lib/prisma.js";
import { responses } from "../utils/response.js";
import { generateTokens, verifyRefreshToken } from "../utils/token.js";
import bcrypt from "bcryptjs";

export const login = async (req, res) => {
  try {
    const { email, mobileNumber, pin } = req.body;
    // Find user by email or mobile number
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { mobileNumber: mobileNumber }],
      },
      select: {
        id: true,
        employeeName: true,
        pin: true,
        employeeId: true,
        email: true,
        mobileNumber: true,
        userType: true,
        createdAt: true,
        shift: true,
        weekendOff: true,
        workLocation: true,
        department: {
          select: {
            name: true,
          },
        },
        designation: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return responses.unauthorized(res, "Invalid email or mobile number");
    }

    const isPinValid = await bcrypt.compare(pin, user.pin);
    if (!isPinValid) {
      return responses.unauthorized(res, "Invalid PIN");
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      mobileNumber: user.mobileNumber,
      userType: user.userType,
    });

    // Store refresh token in database for revocation
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // set access token in HTTP-only cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    user.department = user.department ? user.department.name : null;
    user.designation = user.designation ? user.designation.name : null;
    user.pin = undefined; // Do not return PIN in response

    return responses.loginSuccess(res, {
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return responses.badRequest(res, "Refresh token is required");
    }
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    const userId = decoded.userId;

    // Find user and validate refresh token
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.refreshToken !== refreshToken) {
      return responses.unauthorized(res, "Invalid refresh token");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      userType: user.userType,
      mobileNumber: user.mobileNumber,
    });
    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    // set new access token in HTTP-only cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return responses.loginSuccess(res, {
      user: {
        userId: user.id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        userType: user.userType,
      },
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Invalidate refresh token in database
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return responses.logoutSuccess(res);
  } catch (error) {
    console.error("Logout error:", error);
    responses.serverError(res, "Internal server error");
  }
};

export const loggedInUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        employeeName: true,
        employeeId: true,
        email: true,
        mobileNumber: true,
        userType: true,
        createdAt: true,
        shift: true,
        weekendOff: true,
        workLocation: true,
        department: {
          select: {
            name: true,
          },
        },
        designation: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return responses.notFound(res, "User not found");
    }

    user.department = user.department ? user.department.name : null;
    user.designation = user.designation ? user.designation.name : null;

    return responses.loginSuccess(res, {
      user,
    });
  } catch (error) {
    console.error("Get logged-in user error:", error);
    responses.serverError(res, "Internal server error");
  }
};
