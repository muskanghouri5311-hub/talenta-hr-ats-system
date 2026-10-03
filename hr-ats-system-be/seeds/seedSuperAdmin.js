const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const Role = require("../models/Role");
const User = require("../models/User");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB Connected");
  } catch (error) {
    console.error("✗ Database Connection Error:", error.message);
    process.exit(1);
  }
};

const DEFAULT_PERMISSIONS = [
  {
    module: "dashboard",
    view: false,
    create: false,
    edit: false,
    delete: false,
  },
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
    module: "departments",
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
    module: "auditLogs",
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

const SUPER_ADMIN_PERMISSIONS = [
  {
    module: "dashboard",
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  {
    module: "jobRequisitions",
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  {
    module: "candidates",
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  {
    module: "atsRanking",
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  {
    module: "interviews",
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  {
    module: "offerLetters",
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  {
    module: "users",
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  {
    module: "roles",
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  {
    module: "departments",
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  {
    module: "auditLogs",
    view: false,
    create: false,
    edit: false,
    delete: false,
  },
  {
    module: "reports",
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
];

const mergePermissions = (existingPermissions, defaultPermissions) => {
  const existingByModule = new Map(
    (existingPermissions || []).map((permission) => [
      permission.module,
      permission.toObject ? permission.toObject() : permission,
    ])
  );

  return defaultPermissions.map((defaultPermission) => ({
    ...defaultPermission,
    ...(existingByModule.get(defaultPermission.module) || {}),
  }));
};

const seedRoles = async () => {
  try {
    const rolesToCreate = [
      {
        roleName: "SuperAdmin",
        description: "System administrator with full access",
      },
      {
        roleName: "Recruiter",
        description: "Recruiter responsible for recruitment",
      },
      {
        roleName: "HR/Manager",
        description: "HR or manager responsible for employee management",
      },
      {
        roleName: "Interviewer",
        description: "Interviewer responsible for conducting interviews",
      },
    ];

    const createdRoles = [];

    for (const systemRole of rolesToCreate) {
      let role = await Role.findOne({
        roleName: systemRole.roleName,
      });

      if (!role) {
        role = await Role.create({
          roleName: systemRole.roleName,
          description: systemRole.description,
          isSystemRole: true,
          permissions:
            systemRole.roleName === "SuperAdmin"
              ? SUPER_ADMIN_PERMISSIONS.map((permission) => ({
                  ...permission,
                }))
              : DEFAULT_PERMISSIONS.map((permission) => ({
                  ...permission,
                })),
        });

        createdRoles.push(role);
      } else {
        role.isSystemRole = true;
        role.description = systemRole.description;

        if (role.roleName === "SuperAdmin") {
          role.permissions = SUPER_ADMIN_PERMISSIONS.map(
            (permission) => ({
              ...permission,
            })
          );
        } else {
          role.permissions = mergePermissions(
            role.permissions,
            DEFAULT_PERMISSIONS
          );
        }

        await role.save();
      }
    }

    const allRoles = await Role.find();

    for (const role of allRoles) {
      if (role.isSystemRole) continue;

      if (!role.description) {
        role.description = `${role.roleName} role`;
      }

      role.permissions = mergePermissions(
        role.permissions,
        DEFAULT_PERMISSIONS
      );

      await role.save();
    }

    if (createdRoles.length > 0) {
      console.log(
        `✓ ${createdRoles.length} new system role(s) created`
      );
    } else {
      console.log("✓ System roles already exist");
    }

    return await Role.find();
  } catch (error) {
    console.error("✗ Error with roles:", error.message);
    throw error;
  }
};

const seedSuperAdmin = async (roles) => {
  try {
    // ✅ FIX: role pehle dhundo, existing-user check se pehle,
    // taake ye hamesha available rahe — chahe user naya bane ya
    // pehle se ho.
    const superAdminRole = roles.find(
      (role) => role.roleName === "SuperAdmin"
    );

    if (!superAdminRole) {
      throw new Error("SuperAdmin role not found");
    }

    const existingSuperAdmin = await User.findOne({
      email: "superadmin@compilex.com",
    });

    if (existingSuperAdmin) {
      console.log("✓ SuperAdmin user already exists");

      // ✅ FIX: existing user ka role bhi hamesha refresh karo,
      // taake agar roles collection kabhi dobara ban jaye
      // (naye ObjectIds ke sath), to user ka reference
      // dangling na rahe.
      existingSuperAdmin.role = superAdminRole._id;
      existingSuperAdmin.department = null;

      await existingSuperAdmin.save();

      console.log(
        "✓ SuperAdmin role re-linked & department cleared"
      );

      return existingSuperAdmin;
    }

    const hashedPassword = await bcrypt.hash(
      "SuperAdmin@123",
      10
    );

    const superAdmin = await User.create({
      name: "Super Admin",
      email: "superadmin@compilex.com",
      phoneNumber: "03000000000",
      password: hashedPassword,
      role: superAdminRole._id,
      department: null,
    });

    console.log("✓ SuperAdmin user created successfully");

    console.log("\n=== SUPERADMIN CREDENTIALS ===");
    console.log("Email: superadmin@compilex.com");
    console.log("Password: SuperAdmin@123");
    console.log("==============================\n");

    return superAdmin;
  } catch (error) {
    console.error(
      "✗ Error creating SuperAdmin user:",
      error.message
    );

    throw error;
  }
};

const runSeeder = async () => {
  try {
    console.log("\n🌱 Starting Database Seeder...\n");

    await connectDB();

    const roles = await seedRoles();

    await seedSuperAdmin(roles);

    console.log(
      "✓ Database seeding completed successfully!\n"
    );

    await mongoose.connection.close();

    console.log("✓ Database connection closed");

    process.exit(0);
  } catch (error) {
    console.error(
      "✗ Seeding failed:",
      error.message
    );

    await mongoose.connection.close();

    process.exit(1);
  }
};

runSeeder();