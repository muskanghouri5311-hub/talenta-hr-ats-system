const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    // =====================================
    // FIND USER + ROLE + PERMISSIONS
    // =====================================
    

    const user = await User.findOne({
      email,
    }).populate({
      path: "role",
      select: "roleName permissions",
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================
    // CHECK PASSWORD
    // =====================================
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    // =====================================
    // UPDATE LAST LOGIN
    // =====================================
    user.lastLogin = new Date();

    await user.save();

    // =====================================
    // CREATE TOKEN
    // =====================================
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,

        role: user.role
          ? user.role.roleName
          : null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // =====================================
    // RESPONSE
    // =====================================
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,

      data: {
        id: user._id,
        name: user.name,
        email: user.email,

        lastLogin: user.lastLogin,

        mustChangePassword:
          user.mustChangePassword,

        role: user.role
          ? {
              id: user.role._id,
              roleName: user.role.roleName,
              permissions: user.role.permissions,
            }
          : null,
      },
    });

  } catch (error) {
    console.error(
      "Login Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = loginUser;