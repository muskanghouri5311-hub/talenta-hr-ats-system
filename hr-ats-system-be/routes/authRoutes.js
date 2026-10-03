const express = require("express");

const router = express.Router();

const loginUser = require("../controllers/auth/loginController");
const forgotPassword = require("../controllers/auth/forgotPasswordController");
const resetPassword = require("../controllers/auth/resetPasswordController");
const changePassword = require("../controllers/auth/changePasswordController");
const updatePassword = require("../controllers/auth/updatePasswordController");

const authMiddleware = require("../middleware/authMiddleware");

// Authentication Routes

router.post("/login", loginUser);

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password/:token",
  resetPassword
);

router.post(
  "/change-password",
  authMiddleware,
  changePassword
);

router.post(
    "/update-password/:token",
    updatePassword
);

module.exports = router;