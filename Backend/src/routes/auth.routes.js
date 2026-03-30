import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware} from "../middleware/auth.middleware.js";
import * as validate from "../validators/auth.validator.js";


const router = Router();

router.post("/login", validate.loginValidationRules(), authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authMiddleware, authController.logout);
router.get("/me", authMiddleware, authController.loggedInUser);

export default router;