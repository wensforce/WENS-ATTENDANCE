import { Router } from 'express';
import { authMiddleware,adminMiddleware } from '../middleware/auth.middleware.js';
import * as departmentController from '../controllers/department.controller.js';

const router = Router();

// Define department routes here (e.g., create, read, update, delete departments)
router.post('/', authMiddleware, adminMiddleware, departmentController.createDepartment);
router.get('/', authMiddleware, adminMiddleware, departmentController.getDepartments);
router.get('/:id', authMiddleware, adminMiddleware, departmentController.getDepartmentById);
router.put('/:id', authMiddleware, adminMiddleware, departmentController.updateDepartment);
router.delete('/:id', authMiddleware, adminMiddleware, departmentController.deleteDepartment);

export default router;