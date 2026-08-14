import { Router } from "express";
import * as webhookController from "../controllers/webhook.controller.js";
import * as webhookValidator from "../validators/webhook.validator.js";
import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/auth.middleware.js";
const router = Router();

router.post(
  "/create",
  authMiddleware,
  adminMiddleware,
  webhookValidator.webhookValidation,
  webhookController.createWebhook,
);
router.get(
  "/all",
  authMiddleware,
  adminMiddleware,
  webhookController.getWebhooks,
);
router.put(
  "/update/:id",
  authMiddleware,
  adminMiddleware,
  webhookValidator.webhookValidation,
  webhookController.updateWebhook,
);
router.delete(
  "/delete/:id",
  authMiddleware,
  adminMiddleware,
  webhookController.deleteWebhook,
);

export default router;
