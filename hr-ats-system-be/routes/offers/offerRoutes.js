const express = require("express");

const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");
const checkPermission = require("../../middleware/checkPermission");

const {
  sendOffer,
  getAllOffers,
  getCandidateOffer,
  updateOfferStatus,
} = require("../../controllers/offer/offerController");

// Get all offers
router.get(
  "/",
  authMiddleware,
  checkPermission("offerLetters", "view"),
  getAllOffers
);

// Send offer
router.post(
  "/send",
  authMiddleware,
  checkPermission("offerLetters", "create"),
  sendOffer
);

// Get candidate offer
router.get(
  "/candidate/:candidateId",
  authMiddleware,
  checkPermission("offerLetters", "view"),
  getCandidateOffer
);

// Update offer status
router.patch(
  "/candidate/:candidateId/status",
  authMiddleware,
  checkPermission("offerLetters", "edit"),
  updateOfferStatus
);

module.exports = router;