const express = require("express");

const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");
const checkPermission = require("../../middleware/checkPermission");

const {
  createRole,
  getRoles,
  roleLookup,
  getRole,
  updateRole,
  deleteRole,
} = require("../../controllers/roles/roles&permissionController");

// Create Role
router.post(
  "/",
  authMiddleware,
  checkPermission("users", "create"),
  createRole
);
// =====================================
// GET ALL ROLES
// =====================================
router.get(
  "/",
  authMiddleware,
  checkPermission("users", "view"),
  getRoles
);

// =====================================
// ROLE LOOKUP
// =====================================
router.get(
  "/lookup",
  authMiddleware,
  checkPermission("users", "view"),
  roleLookup
);

// =====================================
// GET SINGLE ROLE
// =====================================
router.get(
  "/:id",
  authMiddleware,
  checkPermission("users", "view"),
  getRole
);
// =====================================
// UPDATE ROLE
// ONLY SUPER ADMIN
// =====================================
router.put(
  "/:id",
  authMiddleware,
  checkPermission("users", "edit"),
  updateRole
);

// =====================================
// DELETE ROLE
// ONLY SUPER ADMIN
// =====================================
router.delete(
  "/:id",
  authMiddleware,
  checkPermission("users", "delete"),
  deleteRole
);

module.exports = router;