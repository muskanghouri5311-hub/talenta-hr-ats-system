const mongoose = require("mongoose");
const Department = require("../../models/Department");
const logActivity = require("../../services/audit/auditService");

// =====================================================
// GET ALL DEPARTMENTS
// =====================================================

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({
      name: 1,
    });

    return res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    console.error("GET DEPARTMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE DEPARTMENT
// =====================================================

const getDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error("GET DEPARTMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch department",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE DEPARTMENT
// =====================================================

const createDepartment = async (req, res) => {
  try {
    const { name, headName } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const cleanName = name.trim();

    const cleanHeadName = headName
      ? headName.trim()
      : "";

    // Case-insensitive duplicate check
    const existingDepartment = await Department.findOne({
      name: {
        $regex: `^${escapeRegex(cleanName)}$`,
        $options: "i",
      },
    });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: "Department already exists",
      });
    }

        const department = await Department.create({
      name: cleanName,
      headName: cleanHeadName,
      employees: 0,
    });

    await logActivity({
      userId: req.user?.id,
      action: "CREATE",
      module: "Departments & Types",
      description: `Created department ${department.name}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 201,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    console.error("CREATE DEPARTMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create department",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE DEPARTMENT
// =====================================================

const putDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, headName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const cleanName = name.trim();

    const cleanHeadName = headName
      ? headName.trim()
      : "";

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const existingDepartment = await Department.findOne({
      _id: { $ne: id },
      name: {
        $regex: `^${escapeRegex(cleanName)}$`,
        $options: "i",
      },
    });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: "Department already exists",
      });
    }

       department.name = cleanName;
    department.headName = cleanHeadName;

    // employees ko change nahi karna
    await department.save();

    await logActivity({
      userId: req.user?.id,
      action: "UPDATE",
      module: "Departments & Types",
      description: `Updated department ${department.name}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    console.error("UPDATE DEPARTMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update department",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE DEPARTMENT
// =====================================================

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    if (Number(department.employees) > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete department because users are assigned to it",
      });
    }

        const deletedName = department.name;

    await department.deleteOne();

    await logActivity({
      userId: req.user?.id,
      action: "DELETE",
      module: "Departments & Types",
      description: `Deleted department ${deletedName}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("DELETE DEPARTMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete department",
      error: error.message,
    });
  }
};

// =====================================================
// REGEX ESCAPE
// =====================================================

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getDepartments,
  getDepartment,
  createDepartment,
  putDepartment,
  deleteDepartment,
};