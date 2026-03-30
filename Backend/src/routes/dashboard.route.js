import { Router } from "express";
import { adminMiddleware, authMiddleware } from "../middleware/auth.middleware.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/user", authMiddleware, dashboardController.getUserDashboard);
router.get("/admin", authMiddleware,  adminMiddleware, dashboardController.getAdminDashboard);
export default router;
