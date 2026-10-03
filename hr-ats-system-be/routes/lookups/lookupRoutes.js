const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");
const checkPermission = require("../../middleware/checkPermission");

const {
  getRolesLookup,
  getDepartmentsLookup,
  getEmploymentTypesLookup,
  getUsersLookup,
} = require("../../controllers/lookups/lookupController");

router.get("/roles", authMiddleware, checkPermission("users", "view"), getRolesLookup);
router.get("/employment-types", authMiddleware, getEmploymentTypesLookup);
router.get("/users", authMiddleware, getUsersLookup);
router.get("/departments", authMiddleware, getDepartmentsLookup);

module.exports = router;