const express = require("express");

const router = express.Router();

const {
  calculateScore,
  getCandidateATSResult,
  getRanking,
} = require("../../controllers/ats/atsController");

const authMiddleware = require("../../middleware/authMiddleware");

const checkPermission = require("../../middleware/checkPermission");

// =====================================
// PROTECTED ATS ROUTES
// =====================================

// Calculate ATS score
router.post(
  "/score/:candidateId",
  authMiddleware,
  checkPermission("atsRanking", "edit"),
  calculateScore
);

// View candidate ATS result
router.get(
  "/result/:candidateId",
  authMiddleware,
  checkPermission("atsRanking", "view"),
  getCandidateATSResult
);

// View ATS ranking
router.get(
  "/ranking/:requisitionId",
  authMiddleware,
  checkPermission("atsRanking", "view"),
  getRanking
);

module.exports = router;