import express from "express";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import attendanceRoutes from "./routes/attendance.route.js";
import LeavesRoutes from "./routes/leaves.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import departmentRoutes from "./routes/department.route.js";
import designationRoutes from "./routes/designation.route.js";
import report from "./routes/report.route.js";
import notificationRoutes from "./routes/notification.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health-check", (req, res) => {
  res.send("Hello World!");
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/leaves", LeavesRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/department", departmentRoutes);
app.use("/api/v1/designation", designationRoutes);
app.use("/api/v1/report", report);
app.use("/api/v1/notifications", notificationRoutes);


export default app;
