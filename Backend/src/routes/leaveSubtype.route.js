import { Router } from "express";
import * as leaveSubtypeController from "../controllers/leaveSubtype.controller.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.middleware.js";
import * as leaveSubtypeValidator from "../validators/leaveSubtype.validator.js";
const router = Router();

router.post("/", authMiddleware, adminMiddleware, leaveSubtypeValidator.createLeaveSubtypeValidationRules(), leaveSubtypeController.createLeaveSubType);
router.get("/", authMiddleware, adminMiddleware, leaveSubtypeController.getAllLeaveSubTypes);
router.put("/:id", authMiddleware, adminMiddleware, leaveSubtypeValidator.updateLeaveSubtypeValidationRules(), leaveSubtypeController.updateLeaveSubType);
router.delete("/:id", authMiddleware, adminMiddleware, leaveSubtypeController.deleteLeaveSubType);

export default router;