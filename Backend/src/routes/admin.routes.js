import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import * as validate from "../validators/admin.validator.js";

const router = Router();

router.post("/employee", authMiddleware, adminMiddleware, validate.registerValidationRules(), adminController.registerEmployee);
router.post("/employee/reset-pin", authMiddleware, adminMiddleware, validate.resetPinValidationRules(), adminController.resetPin);
router.put("/employee/:id", authMiddleware, adminMiddleware, validate.updateValidationRules(), adminController.updateEmployee);
router.delete("/employee/:id", authMiddleware, adminMiddleware, validate.deleteValidationRules(), adminController.deleteEmployee);
router.get("/employees", authMiddleware, adminMiddleware, adminController.getAllEmployees);
router.get("/employee/:id", authMiddleware, adminMiddleware, validate.getByIdValidationRules(), adminController.getEmployeeById);
router.patch("/employee/:id/skip-location-check", authMiddleware, adminMiddleware, adminController.toggleSkipLocationCheck);

export default router;