const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../../models/User");
const Role = require("../../models/Role");
const Department = require("../../models/Department");
const sendEmail = require("../../config/sendEmail");
const logActivity = require("../../services/audit/auditService");

// =====================================================
// NORMALIZE ROLE NAME
// =====================================================

const normalizeRoleName = (roleName = "") => {
  return roleName
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

// =====================================================
// CHECK SUPERADMIN ROLE
// =====================================================

const isSuperAdminRole = (roleName = "") => {
  return normalizeRoleName(roleName) === "superadmin";
};

// ================= CREATE USER =================

const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      role,
      department,
    } = req.body;

    // Required fields
    if (!name || !email || !phoneNumber || !role || !department) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ================= CHECK EMAIL =================

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // ================= CHECK PHONE =================

    const existingPhone = await User.findOne({ phoneNumber });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    // ================= CHECK ROLE =================

    const roleExists = await Role.findById(role);

    if (!roleExists) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // =====================================================
    // SUPERADMIN PROTECTION
    // =====================================================

    if (isSuperAdminRole(roleExists.roleName)) {
      return res.status(403).json({
        success: false,
        message: "You cannot create a SuperAdmin user",
      });
    }

    // ================= CHECK DEPARTMENT =================

    const departmentExists =
      await Department.findById(department);

    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // ================= GENERATE TEMP PASSWORD =================

    const temporaryPassword = crypto
      .randomBytes(10)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 12);

    const hashedPassword = await bcrypt.hash(
      temporaryPassword,
      10
    );

    // ================= CREATE USER =================

    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      department,
      mustChangePassword: true,
    });

    // ================= INCREASE EMPLOYEE COUNT =================

    await Department.findByIdAndUpdate(
      department,
      {
        $inc: {
          employees: 1,
        },
      }
    );

    // ================= EMAIL =================

    const message = `
Hello ${name},

You have been invited to access the system.

Your login details are:

Email: ${email}
Temporary Password: ${temporaryPassword}

Please log in using these credentials and change your password after your first login.

Thank you.
`;

    // ================= GET CREATED USER =================

    const createdUser = await User.findById(user._id)
      .populate("role", "roleName")
      .populate("department", "name");

    // ================= SEND EMAIL =================

    sendEmail({
      email,
      subject: "System Account Invitation",
      message,
    }).catch((emailError) => {
      console.error(
        "INVITE EMAIL ERROR:",
        emailError.message
      );
    });

    // ================= SUCCESS =================

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: createdUser,
    });
  } catch (error) {
    console.log(
      "CREATE USER ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL USERS =================

const getUsers = async (req, res) => {
  try {
    const allUsers = await User.find()
      .sort({ createdAt: -1 })
      .populate("role", "roleName")
      .populate("department", "name");

    // =====================================================
    // REMOVE ALL VARIATIONS OF SUPERADMIN
    // =====================================================

    const users = allUsers.filter(
      (user) => !isSuperAdminRole(user.role?.roleName)
    );

    const pendingInvites = users.filter(
      (user) => user.mustChangePassword === true
    ).length;

    return res.status(200).json({
      success: true,
      count: users.length,
      pendingInvites,
      data: users,
    });
  } catch (error) {
    console.log(
      "GET USERS ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET SINGLE USER =================

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("role", "roleName")
      .populate("department", "name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================================
    // NEVER RETURN SUPERADMIN
    // =====================================================

    if (isSuperAdminRole(user.role?.roleName)) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.log(
      "GET USER ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE USER =================

const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      role,
      department,
    } = req.body;

    const user = await User.findById(req.params.id)
      .populate("role", "roleName");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================================
    // PROTECT EXISTING SUPERADMIN
    // =====================================================

    if (isSuperAdminRole(user.role?.roleName)) {
      return res.status(403).json({
        success: false,
        message: "SuperAdmin cannot be updated",
      });
    }

    // ================= EMAIL =================

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({
        email,
        _id: {
          $ne: user._id,
        },
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      user.email = email;
    }

    // ================= PHONE =================

    if (
      phoneNumber &&
      phoneNumber !== user.phoneNumber
    ) {
      const existingPhone = await User.findOne({
        phoneNumber,
        _id: {
          $ne: user._id,
        },
      });

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number already exists",
        });
      }

      user.phoneNumber = phoneNumber;
    }

    // =====================================================
    // UPDATE ROLE
    // =====================================================

    if (role) {
      const roleExists = await Role.findById(role);

      if (!roleExists) {
        return res.status(404).json({
          success: false,
          message: "Invalid Role",
        });
      }

      // ===================================================
      // NEVER ALLOW SUPERADMIN
      // ===================================================

      if (isSuperAdminRole(roleExists.roleName)) {
        return res.status(403).json({
          success: false,
          message: "You cannot assign the SuperAdmin role",
        });
      }

      user.role = role;
    }

    // ================= DEPARTMENT =================

    if (department) {
      const departmentExists =
        await Department.findById(department);

      if (!departmentExists) {
        return res.status(404).json({
          success: false,
          message: "Invalid department",
        });
      }

      const oldDepartmentId = user.department
        ? user.department.toString()
        : null;

      const newDepartmentId =
        department.toString();

      if (oldDepartmentId !== newDepartmentId) {
        if (oldDepartmentId) {
          const oldDepartment =
            await Department.findById(
              oldDepartmentId
            );

          if (oldDepartment) {
            oldDepartment.employees = Math.max(
              0,
              Number(oldDepartment.employees) - 1
            );

            await oldDepartment.save();
          }
        }

        departmentExists.employees =
          Number(departmentExists.employees) + 1;

        await departmentExists.save();
      }

      user.department = department;
    }

    // ================= NAME =================

    if (name) {
      user.name = name;
    }

    await user.save();

    // ================= UPDATED USER =================

    const updatedUser =
      await User.findById(user._id)
        .populate("role", "roleName")
        .populate("department", "name");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(
      "UPDATE USER ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE USER =================

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("role", "roleName");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================================
    // PROTECT SUPERADMIN
    // =====================================================

    if (isSuperAdminRole(user.role?.roleName)) {
      return res.status(403).json({
        success: false,
        message: "SuperAdmin cannot be deleted",
      });
    }

    // ================= DEPARTMENT COUNT =================

    if (user.department) {
      const department =
        await Department.findById(user.department);

      if (department) {
        department.employees = Math.max(
          0,
          Number(department.employees) - 1
        );

        await department.save();
      }
    }

    // ================= DELETE =================

       // ================= DELETE =================

    await user.deleteOne();

    await logActivity({
      userId: req.user?.id,
      action: "DELETE",
      module: "User Management",
      description: `Deactivated user ${user.name}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(
      "DELETE USER ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= EXPORTS =================

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};