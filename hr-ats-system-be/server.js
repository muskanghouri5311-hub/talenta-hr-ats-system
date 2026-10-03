const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/user/userRoutes");
const roleRoutes = require("./routes/role/roleRoutes");
const lookupRoutes = require("./routes/lookups/lookupRoutes");
const departmentRoutes = require("./routes/department/departmentRoutes");
const requisitionRoutes = require("./routes/jobRequisitions/requisitionRoutes");
const candidateRoutes = require("./routes/candidates/candidateRoutes");
const interviewRoutes = require("./routes/interviews/interviewRoutes");
const atsRoutes = require("./routes/ats/atsRoutes");
const offerRoutes = require("./routes/offers/offerRoutes");
const reportsRoutes =require("./routes/reports/reportsRoutes")
const dashboardRoutes = require("./routes/dashboard/dashboardRoutes");
const searchRoutes = require("./routes/search/searchRoutes");

// Audit
const auditLogRoutes = require("./routes/audit/auditLogRoutes");
const auditMiddleware = require("./middleware/auditMiddleware");

const myInterviewRoutes = require("./routes/interviews/myInterviewRoutes");
connectDB();

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

// ==========================
// Rate Limiter
// ==========================
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// ==========================
// Audit Middleware
// Must be before routes
// ==========================
app.use(auditMiddleware);

// ==========================
// Routes
// ==========================
app.use("/api/auth", authRoutes);
app.use("/api/ats", atsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/lookups", lookupRoutes);
app.use("/api/requisitions", requisitionRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/reports",reportsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/search", searchRoutes);
app.use(
  "/api/my-interviews",
  myInterviewRoutes
);

// Audit Log Routes
app.use("/api/audit-logs", auditLogRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CompileX Backend Running...",
  });
});

// ==========================
// 404 handler
// ==========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================
// Centralized error handler
// ==========================
app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});