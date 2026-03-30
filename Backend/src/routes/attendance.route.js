import { Router } from "express";
import * as attendance from "../controllers/attendance.controller.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";


const router = Router();

// /attendance/check-in
router.get("/",authMiddleware,adminMiddleware, attendance.getAllAttendance);
router.get("/special", authMiddleware, adminMiddleware, attendance.getAllSpecialAttendance);
router.post("/", authMiddleware, adminMiddleware, attendance.createAttendance);
router.post("/check-in", upload.single("checkInImage"), authMiddleware, attendance.checkIn);
router.post("/check-out", upload.single("checkOutImage"), authMiddleware, attendance.checkOut);
router.post("/special-check-in", upload.single("checkInImage"), authMiddleware, attendance.specialDutyCheckIn);
router.post("/special-check-out", upload.single("checkOutImage"), authMiddleware, attendance.specialDutyCheckOut);
router.get("/calender", authMiddleware, attendance.getAttendanceCalendar);
router.get("/get-details/:attendanceId", authMiddleware, attendance.getAttendanceById);
router.get("/get-special-details/:attendanceId", authMiddleware, attendance.getSpecialAttendanceById);
router.put("/update/:attendanceId", authMiddleware, adminMiddleware, upload.single("checkInImage"), attendance.updateAttendance);
router.put("/update-special/:attendanceId", authMiddleware, adminMiddleware, upload.single("checkInImage"), attendance.updateSpecialAttendance);
router.delete("/delete", authMiddleware, adminMiddleware, attendance.deleteAttendanceInBulk);
router.delete("/delete-special", authMiddleware, adminMiddleware, attendance.deleteSpecialAttendanceInBulk);
export default router;