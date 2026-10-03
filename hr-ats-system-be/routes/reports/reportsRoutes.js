const express = require("express");
const router = express.Router();

const {
  getRecruiterPerformance,
  exportReport,
} = require("../../controllers/reports/reportsController");

const authMiddleware = require("../../middleware/authMiddleware");
const checkPermission = require("../../middleware/checkPermission");

router.get(
  "/recruiter-performance",
  authMiddleware,
  checkPermission("reports", "view"),
  getRecruiterPerformance
);

router.get(
  "/export",
  authMiddleware,
  checkPermission("reports", "view"),
  exportReport
);

module.exports = router;