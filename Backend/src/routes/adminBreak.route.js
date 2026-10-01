import { Router } from "express";
import { authMiddleware, adminMiddleware} from "../middleware/auth.middleware.js";
import * as adminBreakController from "../controllers/adminBreak.controller.js";
import * as adminBreakValidator from "../validators/breakConfig.validator.js";
const router = Router();

router.post("/", authMiddleware, adminMiddleware, adminBreakValidator.createBreakConfigValidationRules(), adminBreakController.createBreakConfig);
router.get("/", authMiddleware, adminMiddleware, adminBreakController.getAllBreakConfigs);

// Access routes must be registered before /:id so "access" is not captured as an id
router.get("/access/:userId", authMiddleware, adminMiddleware, adminBreakValidator.getBreakAccessValidationRules(), adminBreakController.getBreakAccess);
router.put("/access/:userId", authMiddleware, adminMiddleware, adminBreakValidator.setOrUpdateBreakAccessValidationRules(), adminBreakController.setOrUpdateBreakAccess);

router.get("/:id", authMiddleware, adminMiddleware, adminBreakValidator.getIdValidationRules(), adminBreakController.getBreakConfigById);
router.put("/:id", authMiddleware, adminMiddleware, adminBreakValidator.updateBreakConfigValidationRules(), adminBreakController.updateBreakConfig);
router.delete("/:id", authMiddleware, adminMiddleware, adminBreakValidator.getIdValidationRules(), adminBreakController.deleteBreakConfig);

export default router;
