const express = require("express");

const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");
const checkPermission = require("../../middleware/checkPermission");

const {
  scheduleInterview,
  getAllInterviews,
  getInterview,
  confirmInterview,
  rescheduleInterview,
  cancelInterview,
  completeInterview,
} = require("../../controllers/interviews/interviewController");

// =====================================
// CREATE / SCHEDULE INTERVIEW
// =====================================

router.post(
  "/",
  authMiddleware,
  checkPermission("interviews", "create"),
  scheduleInterview
);

// =====================================
// GET ALL INTERVIEWS
// =====================================

router.get(
  "/",
  authMiddleware,
  checkPermission("interviews", "view"),
  getAllInterviews
);

// =====================================
// GET SINGLE INTERVIEW
// =====================================

router.get(
  "/:id",
  authMiddleware,
  checkPermission("interviews", "view"),
  getInterview
);

// =====================================
// CONFIRM INTERVIEW
// =====================================

router.patch(
  "/:id/confirm",
  authMiddleware,
  checkPermission("interviews", "edit"),
  confirmInterview
);

// =====================================
// RESCHEDULE INTERVIEW
// =====================================

router.patch(
  "/:id/reschedule",
  authMiddleware,
  checkPermission("interviews", "edit"),
  rescheduleInterview
);

// =====================================
// CANCEL INTERVIEW
// =====================================

router.patch(
  "/:id/cancel",
  authMiddleware,
  checkPermission("interviews", "edit"),
  cancelInterview
);

// =====================================
// COMPLETE INTERVIEW
// =====================================

router.patch(
  "/:id/complete",
  authMiddleware,
  checkPermission("interviews", "edit"),
  completeInterview
);

module.exports = router;