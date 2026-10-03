const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../../models/User");

const updatePassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;

        // Check required fields
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password are required",
            });
        }

        // Password validation
        const passwordRegex =
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters long and contain at least one letter, one number, and one special character.",
            });
        }

        // Check passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        // Hash token from URL
        const resetPasswordToken = crypto
            .createHash("sha256")
            .update(req.params.token)
            .digest("hex");

        // Find user with valid token
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        // Hash and update password
        user.password = await bcrypt.hash(newPassword, 10);

        // Remove reset token after successful password update
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully. Please login again.",
        });

    } catch (error) {
        console.error("UPDATE PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

module.exports = updatePassword;