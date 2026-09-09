import { Router } from "express";
import { adminMiddleware, authMiddleware } from "../middleware/auth.middleware.js";
import * as regularize from "../controllers/regularize.controller.js";
import * as RegularizeValidator from "../validators/regularize.validator.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  RegularizeValidator.createRegularizeValidationRules(),
  regularize.createRegularization,
);

router.get(
  "/",
  authMiddleware,
  RegularizeValidator.listRegularizeValidationRules(),
  regularize.listRegularizations,
);

router.get(
  "/:id",
  authMiddleware,
  RegularizeValidator.idParamValidationRules(),
  regularize.getRegularizationById,
);

router.patch(
  "/:id/approve",
  authMiddleware,
  adminMiddleware,
  RegularizeValidator.approveRegularizeValidationRules(),
  regularize.approveRegularization,
);

router.patch(
  "/:id/reject",
  authMiddleware,
  adminMiddleware,
  RegularizeValidator.rejectRegularizeValidationRules(),
  regularize.rejectRegularization,
);

router.delete(
  "/:id",
  authMiddleware,
  RegularizeValidator.idParamValidationRules(),
  regularize.cancelRegularization,
);

export default router;
