const bcrypt = require("bcryptjs");
const User = require("../../models/User");

const registerUser = async (req, res) => {
    try {
        const {
    name,
    email,
    phoneNumber,
    password,
    confirmPassword,
    role,
} = req.body;

        // Check required fields
        if (
    !name ||
    !email ||
    !phoneNumber ||
    !password ||
    !confirmPassword ||
    !role
) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Check password match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        // Check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }
        const existingPhone = await User.findOne({ phoneNumber });

if (existingPhone) {
    return res.status(400).json({
        success: false,
        message: "Phone number already exists",
    });
}

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await User.create({
            name,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            },
        });

    } catch (error) {
        console.error("Register Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = registerUser;