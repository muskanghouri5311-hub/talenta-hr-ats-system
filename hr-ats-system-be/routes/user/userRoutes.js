const express = require("express");

const router = express.Router();

const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require("../../controllers/user/userController");

const authMiddleware = require("../../middleware/authMiddleware");
const checkPermission = require("../../middleware/checkPermission");

router.post(
  "/",
  authMiddleware,
  checkPermission("users", "create"),
  createUser
);

router.get(
  "/",
  authMiddleware,
  checkPermission("users", "view"),
  getUsers
);

router.get(
  "/:id",
  authMiddleware,
  checkPermission("users", "view"),
  getUser
);

router.put(
  "/:id",
  authMiddleware,
  checkPermission("users", "edit"),
  updateUser
);

router.delete(
  "/:id",
  authMiddleware,
  checkPermission("users", "delete"),
  deleteUser
);

module.exports = router;