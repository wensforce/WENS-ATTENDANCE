import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import * as breakController from "../controllers/break.controller.js";

const router = Router();

router.get("/options", authMiddleware, breakController.getBreakOptions);
router.post("/start", authMiddleware, breakController.startBreak);
router.post("/end", authMiddleware, breakController.endBreak);
router.get("/today", authMiddleware, breakController.getTodayBreaks);

// admin routes
router.get("/admin/options/:userId", authMiddleware, adminMiddleware, breakController.getAdminBreakOptions);
router.post("/admin/create", authMiddleware, adminMiddleware, breakController.createBreak);
router.get("/admin/all", authMiddleware, adminMiddleware, breakController.getAllBreaks);
router.get("/admin/:breakId", authMiddleware, adminMiddleware, breakController.getBreakById);
router.put("/admin/update/:breakId", authMiddleware, adminMiddleware, breakController.updateBreak);
router.delete("/admin/delete/:breakId", authMiddleware, adminMiddleware, breakController.deleteBreak);
export default router;