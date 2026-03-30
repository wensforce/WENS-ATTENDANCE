import { Router } from "express";
import * as LeavesController from "../controllers/leaves.controller.js";
import { adminMiddleware,authMiddleware } from "../middleware/auth.middleware.js";
import * as LeavesValidator from "../validators/leaves.validator.js";
const router = Router();

//  /api/v1/leaves

router.get("/", authMiddleware, LeavesController.getLeavesAndHolidays);
router.get("/get", authMiddleware, LeavesController.getAllLeavesAndHolidays);
router.get("/get/:id", authMiddleware, LeavesController.getLeaveAndHolidayById);
router.get("/dates", authMiddleware, LeavesValidator.getLeavesAndHolidaysByDateValidationRules(), LeavesController.getLeavesAndHolidaysByDate);
router.post("/", authMiddleware, adminMiddleware, LeavesValidator.createLeaveAndHolidayValidationRules(), LeavesController.createLeaveAndHoliday);
router.put("/:id", authMiddleware, adminMiddleware, LeavesValidator.updateLeaveAndHolidayValidationRules(), LeavesController.updateLeaveAndHoliday);
router.delete("/:id", authMiddleware, adminMiddleware, LeavesValidator.deleteLeaveAndHolidayValidationRules(), LeavesController.deleteLeaveAndHoliday);
export default router;