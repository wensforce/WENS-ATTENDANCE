import { Router } from "express";
import * as superAdminController from "../controllers/superAdmin.controller.js";
import * as validate from "../validators/tenant.validator.js";
import {
  authMiddleware,
  superAdminMiddleware,
} from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  superAdminMiddleware,
  validate.createTenantValidation,
  superAdminController.createTenant,
);
router.get(
  "/",
  authMiddleware,
  superAdminMiddleware,
  superAdminController.getTenants,
);
router.get(
  "/:id",
  authMiddleware,
  superAdminMiddleware,
  validate.tenantIdParamValidation,
  superAdminController.getTenantById,
);
router.put(
  "/:id",
  authMiddleware,
  superAdminMiddleware,
  validate.updateTenantValidation,
  superAdminController.updateTenant,
);
router.delete(
  "/:id",
  authMiddleware,
  superAdminMiddleware,
  validate.tenantIdParamValidation,
  superAdminController.deleteTenant,
);

export default router;
