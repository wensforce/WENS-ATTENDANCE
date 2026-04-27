import express from "express";
import morgan from "morgan";
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
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// add retry-after header for rate limit errors
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTTP Request Logger
app.use(morgan("dev"));

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


app.use(express.static(path.join(__dirname, "../../Frontend/build")));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Frontend/build/index.html'));
});


export default app;
