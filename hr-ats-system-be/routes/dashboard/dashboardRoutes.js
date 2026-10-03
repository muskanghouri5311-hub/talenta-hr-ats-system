const express = require("express");

const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");
const checkPermission = require("../../middleware/checkPermission");

const {
  getDashboard,
} = require("../../controllers/dashboard/dashboardController");

router.get(
  "/",
  authMiddleware,
  checkPermission("dashboard", "view"),
  getDashboard
);

module.exports = router;