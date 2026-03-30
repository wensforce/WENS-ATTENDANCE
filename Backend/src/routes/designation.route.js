import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import * as designationController from "../controllers/designation.controller.js";

const router = Router();


// Define designation routes here (e.g., create, read, update, delete designations)

router.post("/", authMiddleware, adminMiddleware, designationController.createDesignation);
router.get("/", authMiddleware, adminMiddleware, designationController.getDesignations);
router.get("/:id", authMiddleware, adminMiddleware, designationController.getDesignationById);
router.put("/:id", authMiddleware, adminMiddleware, designationController.updateDesignation);
router.delete("/:id", authMiddleware, adminMiddleware, designationController.deleteDesignation);

export default router;