const express = require("express");

const {
  getAuditLogs,
  exportAuditLogs,
} = require("../../controllers/audit/auditLogController");

const authMiddleware = require("../../middleware/authMiddleware");
const checkPermission = require("../../middleware/checkPermission");

const router = express.Router();

// ==========================
// EXPORT AUDIT LOGS AS CSV
// ==========================
router.get(
  "/export",
  authMiddleware,
  checkPermission("auditLogs", "view"),
  exportAuditLogs
);

// ==========================
// GET AUDIT LOGS FOR TABLE
// ==========================
router.get(
  "/",
  authMiddleware,
  checkPermission("auditLogs", "view"),
  getAuditLogs
);

module.exports = router;