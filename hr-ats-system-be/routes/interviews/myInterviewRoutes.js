const express = require("express");

const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");

const {
  getMyInterviews,
  getMyInterviewById,
  getMyFeedbackSubmitted,
  getRecommendationOptions,
  submitMyInterviewFeedback,
} = require("../../controllers/interviews/myInterviewController");

router.get(
  "/",
  authMiddleware,
  getMyInterviews
);

router.get(
  "/feedback",
  authMiddleware,
  getMyFeedbackSubmitted
);


router.get(
  "/recommendations",
  authMiddleware,
  getRecommendationOptions
);

router.get(
  "/:id",
  authMiddleware,
  getMyInterviewById
);

router.patch(
  "/:id/feedback",
  authMiddleware,
  submitMyInterviewFeedback
);

module.exports = router;