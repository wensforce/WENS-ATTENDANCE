import { Router } from "express";
import { error, success } from "../utils/response.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.middleware.js";
import * as reportController from "../controllers/report.controller.js";

const router = Router();


router.get("/monthly-report", authMiddleware, adminMiddleware, reportController.getMonthlyReport);
router.get("/monthly-report/export", authMiddleware, adminMiddleware, reportController.exportMonthlyReport);
router.get("/monthly-report/:employeeId", authMiddleware, reportController.getMonthlyReportByUserId);



export default router;


