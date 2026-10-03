const User = require("../../models/User");
const crypto = require("crypto");
const sendEmail = require("../../config/sendEmail");

const forgotPassword = async (req, res) => {
  try {
    console.log("FORGOT PASSWORD REQUEST:", req.body);

    const { email } = req.body;

    // Check email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires in 45 minutes
    user.resetPasswordExpire =
      Date.now() + 45 * 60 * 1000;

    await user.save();

    // Reset URL
    const resetUrl =
      `${process.env.FRONTEND_URL}/update-password/${resetToken}`;

    // Email message
    const message = `
Click the link below to update your password.

${resetUrl}

This link will expire in 45 minutes.
`;

    console.log("Sending reset email to:", user.email);
    console.log("Reset URL:", resetUrl);

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Update",
        message,
      });

      console.log("RESET EMAIL SENT SUCCESSFULLY");

    } catch (emailError) {
      console.error(
        "FORGOT PASSWORD EMAIL ERROR:",
        emailError
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to send password reset email",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Password reset link sent successfully.",
    });

  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = forgotPassword;