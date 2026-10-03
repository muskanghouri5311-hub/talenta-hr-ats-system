const express = require("express");

const router = express.Router();

const {
  createDepartment,
  getDepartment,
  getDepartments,
  putDepartment,
  deleteDepartment,
} = require("../../controllers/department/departmentController");

const authMiddleware = require("../../middleware/authMiddleware");
const checkPermission = require("../../middleware/checkPermission");

// Create Department
router.post(
  "/",
  authMiddleware,
  checkPermission("departments", "create"),
  createDepartment
);

// Get All Departments
router.get(
  "/",
  authMiddleware,
  checkPermission("departments", "view"),
  getDepartments
);

// Get Single Department
router.get(
  "/:id",
  authMiddleware,
  checkPermission("departments", "view"),
  getDepartment
);

// Update Department
router.put(
  "/:id",
  authMiddleware,
  checkPermission("departments", "edit"),
  putDepartment
);

// Delete Department
router.delete(
  "/:id",
  authMiddleware,
  checkPermission("departments", "delete"),
  deleteDepartment
);

module.exports = router;