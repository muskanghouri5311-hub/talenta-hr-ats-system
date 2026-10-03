const Role = require("../../models/Role");
const EmploymentType = require("../../models/EmploymentType");
const User = require("../../models/User");
const Department = require("../../models/Department");

// ==========================
// Get Roles Lookup
// ==========================
const getRolesLookup = async (req, res) => {
  try {
    const roles = await Role.find(
      {
        roleName: {
          $ne: "SuperAdmin",
        },
      },
      "_id roleName"
    );

    const lookup = roles.map((role) => ({
      id: role._id,
      name: role.roleName,
    }));

    return res.status(200).json({
      success: true,
      data: lookup,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Get Users Lookup
// ==========================
const getUsersLookup = async (req, res) => {
  try {
    const { role } = req.query;

    let filter = {};

    if (role) {
      const roleDoc = await Role.findOne({
        roleName: role,
      });

      if (!roleDoc) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      filter.role = roleDoc._id;
    }

    const users = await User.find(
      filter,
      "_id name department"
    ).populate(
      "department",
      "_id name"
    );

    const lookup = users.map((user) => ({
      id: user._id,
      name: user.name,

      department:
        user.department?.name || "No Department",
    }));

    return res.status(200).json({
      success: true,
      data: lookup,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================
// Get Departments Lookup
// ==========================
const getDepartmentsLookup = async (req, res) => {
  try {
    const departments = await Department.find({}, "_id name");

    const lookup = departments.map((department) => ({
      id: department._id,
      name: department.name,
    }));

    return res.status(200).json({
      success: true,
      data: lookup,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Get Employment Types Lookup
// ==========================
const getEmploymentTypesLookup = async (req, res) => {
  try {
    const employmentTypes = await EmploymentType.find(
      {},
      "_id name"
    );

    const lookup = employmentTypes.map((type) => ({
      id: type._id,
      name: type.name,
    }));

    return res.status(200).json({
      success: true,
      data: lookup,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getRolesLookup,
  getUsersLookup,
  getDepartmentsLookup,
  getEmploymentTypesLookup,
};