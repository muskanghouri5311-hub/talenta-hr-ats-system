const express = require("express");

const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");
const checkPermission = require("../../middleware/checkPermission");

const {
  createRequisition,
  getRequisitions,
  getPublicOpenRequisitions,
  getPublicRequisitionById,
  getRequisitionCounts,
  getRequisition,
  updateRequisition,
  deleteRequisition,
} = require("../../controllers/jobRequisitions/requisitionController");


// =====================================
// PUBLIC ROUTES
// =====================================

// Career Portal
// Returns ONLY open requisitions
router.get(
  "/public/open",
  getPublicOpenRequisitions
);

// Career Portal
// Returns a single open requisition (for the Apply page)
router.get(
  "/public/open/:id",
  getPublicRequisitionById
);


// =====================================
// PROTECTED INTERNAL ROUTES
// =====================================

// Get requisition counts
router.get(
  "/counts",
  authMiddleware,
  checkPermission("jobRequisitions", "view"),
  getRequisitionCounts
);

// Get all requisitions
router.get(
  "/",
  authMiddleware,
  checkPermission("jobRequisitions", "view"),
  getRequisitions
);

// Get single requisition
router.get(
  "/:id",
  authMiddleware,
  checkPermission("jobRequisitions", "view"),
  getRequisition
);


// Create requisition
router.post(
  "/",
  authMiddleware,
  checkPermission("jobRequisitions", "create"),
  createRequisition
);


// Update requisition
router.put(
  "/:id",
  authMiddleware,
  checkPermission("jobRequisitions", "edit"),
  updateRequisition
);


// Delete requisition
router.delete(
  "/:id",
  authMiddleware,
  checkPermission("jobRequisitions", "delete"),
  deleteRequisition
);


module.exports = router;