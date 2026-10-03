const express = require("express");

const router = express.Router();

const multer = require("multer");

const authMiddleware = require("../../middleware/authMiddleware");

const checkPermission = require("../../middleware/checkPermission");

const {
  applyNow,
  getAllCandidates,
  getCandidate,
  rejectCandidate,
  moveCandidateStage,
  addCandidateNote,
  completeScreening,
  updateInterviewStatus,
  updateOfferStatus,
  getCandidateInterviewFeedback,
} = require("../../controllers/candidates/candidateController");

// =====================================
// MULTER CONFIGURATION
// =====================================

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 7 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(
        new Error("Only PDF files are allowed"),
        false
      );
    }
  },
});

// =====================================
// PUBLIC ROUTE
// Candidate applies through Career Portal
// =====================================

router.post(
  "/apply",
  upload.single("resume"),
  applyNow
);

// =====================================
// PROTECTED CANDIDATE ROUTES
// =====================================

// View all candidates
router.get(
  "/",
  authMiddleware,
  checkPermission("candidates", "view"),
  getAllCandidates
);

// View single candidate
router.get(
  "/:id",
  authMiddleware,
  checkPermission("candidates", "view"),
  getCandidate
);

router.get(
  "/:id/interview-feedback",
  authMiddleware,
  checkPermission("candidates", "view"),
  getCandidateInterviewFeedback
);

// Complete screening
router.patch(
  "/:id/screening",
  authMiddleware,
  checkPermission("candidates", "edit"),
  completeScreening
);

// Update interview status
router.patch(
  "/:id/interview-status",
  authMiddleware,
  checkPermission("candidates", "edit"),
  updateInterviewStatus
);

// Update offer status
router.patch(
  "/:id/offer-status",
  authMiddleware,
  checkPermission("candidates", "edit"),
  updateOfferStatus
);

// Reject candidate
router.patch(
  "/:id/reject",
  authMiddleware,
  checkPermission("candidates", "edit"),
  rejectCandidate
);

// Move candidate stage
router.patch(
  "/:id/stage",
  authMiddleware,
  checkPermission("candidates", "edit"),
  moveCandidateStage
);

// Add candidate note
router.post(
  "/:id/notes",
  authMiddleware,
  checkPermission("candidates", "create"),
  addCandidateNote
);

module.exports = router;