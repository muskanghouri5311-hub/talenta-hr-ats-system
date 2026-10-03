const Role = require("../models/Role");
const User = require("../models/User");

// Normalize role name
const normalizeRoleName = (roleName) => {
  return String(roleName || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
};

// Normalize module name
const normalizeModule = (moduleName) => {
  const normalized = String(moduleName || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

  return normalized === "role" ? "roles" : normalized;
};

const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      // =====================================
      // 1. GET LOGGED-IN USER ID
      // =====================================

      const userId = req.user?.id || req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // =====================================
      // 2. GET USER WITH ROLE
      // =====================================

      const userRecord = await User.findById(userId)
        .populate({
          path: "role",
          select: "roleName permissions isSystemRole",
        })
        .lean();

      if (!userRecord) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // =====================================
      // 3. GET USER ROLE
      // =====================================

      let role = userRecord.role;

      // Fallback: Find role manually if not populated
      if (!role) {
        const roleName = req.user?.role;

        if (!roleName) {
          return res.status(403).json({
            success: false,
            message: "User role not found",
          });
        }

        role = await Role.findOne({
          roleName: {
            $regex: `^${String(roleName)
              .trim()
              .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },
        }).lean();
      }

      if (!role) {
        return res.status(403).json({
          success: false,
          message: "Role not found",
        });
      }

      // =====================================
      // 4. SUPER ADMIN HAS FULL ACCESS
      // =====================================

      const normalizedRole = normalizeRoleName(role.roleName);

      if (normalizedRole === "superadmin") {
        return next();
      }

      // =====================================
      // 5. FIND MODULE PERMISSION
      // =====================================

      const normalizedRequestedModule = normalizeModule(module);

      const modulePermission = (role.permissions || []).find(
        (permission) =>
          normalizeModule(permission.module) ===
          normalizedRequestedModule
      );

      // =====================================
      // 6. MODULE NOT CONFIGURED
      // =====================================

      if (!modulePermission) {
        return res.status(403).json({
          success: false,
          message: `No permission configured for ${module}`,
        });
      }

      // =====================================
      // 7. CHECK REQUESTED ACTION
      // =====================================

      const permissionValue = modulePermission[action];

      const hasPermission =
        permissionValue === true ||
        permissionValue === "true";

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `You do not have permission to ${action} ${module}`,
        });
      }

      // =====================================
      // 8. ACCESS GRANTED
      // =====================================

      next();
    } catch (error) {
      // Avoid exposing internal error details to the client
      if (process.env.NODE_ENV !== "production") {
        console.error("CHECK PERMISSION ERROR:", error.message);
      }

      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

module.exports = checkPermission;