import { Router } from "express";
import { getAttendanceSetting, updateAttendanceSetting } from "../controllers/attendanceSetting.controller.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.middleware.js"
const router = Router();

router.get("/", authMiddleware, adminMiddleware, getAttendanceSetting);
router.patch("/:id", authMiddleware, adminMiddleware, updateAttendanceSetting);
export default router;