const mongoose = require("mongoose");
const Role = require("../../models/Role");
const logActivity = require("../../services/audit/auditService");

// =====================================================
// NORMALIZE ROLE NAME
// =====================================================
// 1. Lowercase
// 2. Numbers remove
// 3. Special characters remove
// 4. Spaces remove
//
// Example:
//
// "1SuPeR@123-AdMiN456"
//          ↓
// "superadmin"
// =====================================================

const normalizeRoleName = (roleName = "") => {
    return String(roleName)
        .toLowerCase()
        .replace(/[^a-z]/g, "");
};

// =====================================================
// CHECK SUPERADMIN
// =====================================================
// includes() is used instead of ===
// so repeated words are also blocked.
//
// superadmin
// superadminsuperadmin
// superadmin123
// 123superadmin456
// superadminsuperadmin123
// =====================================================

const isSuperAdminName = (roleName = "") => {
    const normalizedName = normalizeRoleName(roleName);

    return normalizedName.includes("superadmin");
};

// ==========================
// Normalize Permission Module
// ==========================

const normalizePermissionModule = (moduleName) => {
    const normalized = String(moduleName || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");

    const canonicalModules = {
        jobrequisitions: "jobRequisitions",
        candidates: "candidates",
        atsranking: "atsRanking",
        interviews: "interviews",
        offerletters: "offerLetters",
        users: "users",
        departments: "departments",
        roles: "roles",
        role: "roles",
        auditlogs: "auditLogs",
        reports: "reports",
    };

    return canonicalModules[normalized] || moduleName;
};

// =====================================================
// CREATE ROLE
// =====================================================

const createRole = async (req, res) => {
    try {
        const { roleName, description } = req.body;

        // ==========================
        // VALIDATE ROLE NAME
        // ==========================

        if (!roleName || !String(roleName).trim()) {
            return res.status(400).json({
                success: false,
                message: "Role name is required.",
            });
        }

        // ==========================
        // VALIDATE DESCRIPTION
        // ==========================

        if (
            !description ||
            !String(description).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Description is required.",
            });
        }

        // =====================================================
        // NORMALIZE INPUT
        // =====================================================

        const normalizedRoleName =
            normalizeRoleName(roleName);

        // =====================================================
        // INVALID ROLE NAME
        // =====================================================

        if (!normalizedRoleName) {
            return res.status(400).json({
                success: false,
                message: "Invalid role name.",
            });
        }

        // =====================================================
        // SUPERADMIN PROTECTION
        // =====================================================
        //
        // This blocks:
        //
        // SuperAdmin
        // Super Admin
        // Super-Admin
        // Super/Admin
        // Super_Admin
        // SUPER@ADMIN
        // 123SuperAdmin456
        // Super123Admin
        // SuperAdminSuperAdmin
        // 1SuperAdmin2SuperAdmin3
        //
        // =====================================================

        if (isSuperAdminName(roleName)) {
            return res.status(403).json({
                success: false,
                message:
                    "SuperAdmin is a system role and cannot be created.",
            });
        }

        // =====================================================
        // CHECK DUPLICATE ROLE
        // =====================================================

        const allRoles = await Role.find();

        const existingRole = allRoles.find(
            (role) =>
                normalizeRoleName(role.roleName) ===
                normalizedRoleName
        );

        if (existingRole) {
            return res.status(409).json({
                success: false,
                message:
                    "A role with this name already exists.",
            });
        }

        // ==========================
        // DEFAULT PERMISSIONS
        // ==========================

        const DEFAULT_PERMISSIONS = [
            {
                module: "jobRequisitions",
                view: false,
                create: false,
                edit: false,
                delete: false,
            },
            {
                module: "candidates",
                view: false,
                create: false,
                edit: false,
                delete: false,
            },
            {
                module: "atsRanking",
                view: false,
                create: false,
                edit: false,
                delete: false,
            },
            {
                module: "interviews",
                view: false,
                create: false,
                edit: false,
                delete: false,
            },
            {
                module: "offerLetters",
                view: false,
                create: false,
                edit: false,
                delete: false,
            },
            {
                module: "users",
                view: false,
                create: false,
                edit: false,
                delete: false,
            },
            {
                module: "roles",
                view: false,
                create: false,
                edit: false,
                delete: false,
            },
            {
                module: "reports",
                view: false,
                create: false,
                edit: false,
                delete: false,
            },
        ];

        // ==========================
        // CREATE ROLE
        // ==========================

                const role = await Role.create({
            roleName: String(roleName).trim(),
            description: String(description).trim(),
            permissions: DEFAULT_PERMISSIONS.map(
                (permission) => ({
                    ...permission,
                })
            ),
            isSystemRole: false,
        });

        await logActivity({
            userId: req.user?.id,
            action: "CREATE",
            module: "Roles & Permissions",
            description: `Created role ${role.roleName}`,
            method: req.method,
            endpoint: req.originalUrl,
            statusCode: 201,
            ipAddress: req.ip,
        });
        req.auditLogged = true;

        return res.status(201).json({
            success: true,
            message: "Role created successfully.",
            data: role,
        });
    } catch (error) {
        console.error(
            "CREATE ROLE ERROR:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================================
// GET ALL ROLES
// =====================================================

const getRoles = async (req, res) => {
    try {
        const roles = await Role.find();

        return res.status(200).json({
            success: true,
            count: roles.length,
            data: roles,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================================
// ROLE LOOKUP
// =====================================================

const roleLookup = async (req, res) => {
    try {
        const roles = await Role.find()
            .select("_id roleName")
            .sort({ roleName: 1 });

        return res.status(200).json({
            success: true,
            count: roles.length,
            data: roles,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================================
// GET SINGLE ROLE
// =====================================================

const getRole = async (req, res) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID.",
            });
        }

        const role = await Role.findById(id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: role,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================================
// UPDATE ROLE
// =====================================================

const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            roleName,
            description,
            permissions,
        } = req.body;

        // ==========================
        // VALIDATE ID
        // ==========================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID.",
            });
        }

        const role = await Role.findById(id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found.",
            });
        }

        // =====================================================
        // NEVER MODIFY SUPERADMIN
        // =====================================================

        if (isSuperAdminName(role.roleName)) {
            return res.status(403).json({
                success: false,
                message:
                    "SuperAdmin is a system role and cannot be modified.",
            });
        }

        // =====================================================
        // CURRENT USER ROLE
        // =====================================================

        const currentUserRole =
            normalizeRoleName(
                req.user?.role
            );

        const isSuperAdmin =
            currentUserRole.includes(
                "superadmin"
            );

        const isOwnRole =
            normalizeRoleName(
                role.roleName
            ) === currentUserRole;

        if (!isSuperAdmin && !isOwnRole) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only update permissions for your own role.",
            });
        }

        // =====================================================
        // ROLE NAME CANNOT BE CHANGED
        // =====================================================

        if (
            roleName &&
            String(roleName).trim() !==
                role.roleName
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Role name cannot be changed once it has been created.",
            });
        }

        // =====================================================
        // DESCRIPTION
        // =====================================================

        if (
            !description ||
            !String(description).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Description is required.",
            });
        }

        role.description =
            String(description).trim();

        // =====================================================
        // PERMISSIONS
        // =====================================================

        if (permissions !== undefined) {
            if (!Array.isArray(permissions)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Permissions must be an array.",
                });
            }

            for (const permission of permissions) {
                if (!permission.module) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Module is required.",
                    });
                }

                if (
                    typeof permission.view !==
                        "boolean" ||
                    typeof permission.create !==
                        "boolean" ||
                    typeof permission.edit !==
                        "boolean" ||
                    typeof permission.delete !==
                        "boolean"
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Permission values must be true or false.",
                    });
                }
            }

            const permissionsByModule =
                new Map();

            // Existing permissions
            for (
                const permission of
                    role.permissions || []
            ) {
                const normalizedModule =
                    normalizePermissionModule(
                        permission.module
                    );

                permissionsByModule.set(
                    normalizedModule,
                    {
                        permission:
                            permission.toObject
                                ? permission.toObject()
                                : permission,
                        module: normalizedModule,
                    }
                );
            }

            // New permissions
            for (const permission of permissions) {
                const normalizedModule =
                    normalizePermissionModule(
                        permission.module
                    );

                permissionsByModule.set(
                    normalizedModule,
                    {
                        permission: {
                            ...permission,
                            module:
                                normalizedModule,
                        },
                        module:
                            normalizedModule,
                    }
                );
            }

            role.permissions =
                Array.from(
                    permissionsByModule.values()
                ).map(
                    ({
                        permission,
                        module,
                    }) => ({
                        ...permission,
                        module,
                    })
                );
        }

        await role.save();

        return res.status(200).json({
            success: true,
            message:
                "Role updated successfully.",
            data: role,
        });
    } catch (error) {
        console.error(
            "UPDATE ROLE ERROR:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================================
// DELETE ROLE
// =====================================================

const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID.",
            });
        }

        const role = await Role.findById(id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found.",
            });
        }

        // =====================================================
        // NEVER DELETE SUPERADMIN
        // =====================================================

        if (isSuperAdminName(role.roleName)) {
            return res.status(403).json({
                success: false,
                message:
                    "SuperAdmin is a system role and cannot be deleted.",
            });
        }

        // =====================================================
        // SYSTEM ROLE PROTECTION
        // =====================================================

        if (role.isSystemRole) {
            return res.status(403).json({
                success: false,
                message:
                    `${role.roleName} is a system role and cannot be deleted.`,
            });
        }

        await role.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Role deleted successfully.",
        });
    } catch (error) {
        console.error(
            "DELETE ROLE ERROR:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createRole,
    getRoles,
    roleLookup,
    getRole,
    updateRole,
    deleteRole,
};