import prisma from "../../lib/prisma.js";
import { verifyAccessToken } from "../utils/token.js";
import { responses } from "../utils/response.js";

const authMiddleware = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken || req.headers.Authorization;
    
    if (!accessToken) {
      return responses.unauthorized(res, "Access token missing");
    }
    // Verify token and extract user info
    const decoded = verifyAccessToken(accessToken);
    const userId = decoded.userId;
    // Fetch user from database
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return responses.unauthorized(res, "User not found");
    }
    // Attach user info to request object
    req.user = {
      userId: user.id,
      email: user.email,
      deviceId: user.deviceId,
      userType: user.userType,
      mobileNumber: user.mobileNumber,
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return responses.unauthorized(res, "Invalid or expired token");
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user?.userType !== "ADMIN") {
    return responses.forbidden(res, "Admin access required");
  }
  next();
};

export { authMiddleware, adminMiddleware };
