
const Requisition = require("../../models/Requisition");
const logActivity = require("../../services/audit/auditService");

const ALLOWED_FIELDS = [
  "role",
  "department",
  "type",
  "location",
  "openings",
  "experienceLevel",
  "minExperienceYears",
  "education",
  "deadline",
  "salaryMin",
  "salaryMax",
  "description",
  "requirements",
  "status",
];

const pickAllowedFields = (body) => {
  const result = {};

  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      result[field] = body[field];
    }
  }

  return result;
};

const checkAndCloseExpiredRequisition = async (requisition) => {
  if (
    requisition.status === "Open" &&
    requisition.deadline &&
    new Date() >= new Date(requisition.deadline)
  ) {
    requisition.status = "Closed";
    await requisition.save();
  }

  return requisition;
};

const getStartOfDay = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfDay = (date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const getRequisitionsByDate = async (selectedDate) => {
  const startDate = getStartOfDay(selectedDate);
  const endDate = getEndOfDay(selectedDate);

  const requisitions = await Requisition.find({
    createdAt: {
      $lte: endDate,
    },
  }).sort({
    createdAt: -1,
  });

  const updatedRequisitions = await Promise.all(
    requisitions.map(checkAndCloseExpiredRequisition)
  );

  const dateWiseRequisitions = updatedRequisitions.filter(
    (requisition) => {
      return new Date(requisition.createdAt) <= endDate;
    }
  );

  return {
    startDate,
    endDate,
    requisitions: dateWiseRequisitions,
  };
};

const getRequisitionDashboardData = async (
  selectedDate = new Date()
) => {
  const {
    startDate,
    endDate,
    requisitions,
  } = await getRequisitionsByDate(selectedDate);

  const counts = {
    All: requisitions.length,
    Open: 0,
    Draft: 0,
    Closed: 0,
    Archived: 0,
  };

  requisitions.forEach((requisition) => {
    if (counts[requisition.status] !== undefined) {
      counts[requisition.status]++;
    }
  });

  return {
    date: startDate,
    startDate,
    endDate,
    counts,
    requisitions,
  };
};

const createRequisition = async (req, res) => {
  try {
    const requisition = await Requisition.create(
      pickAllowedFields(req.body)
    );

    return res.status(201).json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getRequisitions = async (req, res) => {
  try {
    const { status, search } = req.query;

    const requisitions = await Requisition.find().sort({
      createdAt: -1,
    });

    const updatedRequisitions = await Promise.all(
      requisitions.map(checkAndCloseExpiredRequisition)
    );

    let filteredRequisitions =
      status && status !== "All"
        ? updatedRequisitions.filter(
            (requisition) => requisition.status === status
          )
        : updatedRequisitions;

    // =====================================================
    // Phase 3 fix: global navbar search support.
    // Case-insensitive partial match on role, department,
    // and the requisition's own Mongo ID (so pasting/typing
    // the ID also finds it, in lieu of a dedicated
    // human-readable requisition code field).
    // =====================================================
    if (search && search.trim()) {
      const query = search.trim().toLowerCase();

      filteredRequisitions = filteredRequisitions.filter(
        (requisition) => {
          const role = (requisition.role || "").toLowerCase();
          const department = (
            requisition.department || ""
          ).toLowerCase();
          const id = String(requisition._id).toLowerCase();

          return (
            role.includes(query) ||
            department.includes(query) ||
            id.includes(query)
          );
        }
      );
    }

    return res.status(200).json({
      success: true,
      data: filteredRequisitions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// PUBLIC: GET OPEN REQUISITIONS
// =====================================

const getPublicOpenRequisitions = async (req, res) => {
  try {
    // Get only open requisitions
    const requisitions = await Requisition.find({
      status: "Open",
    }).sort({
      createdAt: -1,
    });

    // Close expired requisitions before returning them
    const updatedRequisitions = await Promise.all(
      requisitions.map(checkAndCloseExpiredRequisition)
    );

    // After checking deadlines, only return jobs
    // that are still open
    const openRequisitions = updatedRequisitions.filter(
      (requisition) => requisition.status === "Open"
    );

    return res.status(200).json({
      success: true,
      data: openRequisitions,
    });
  } catch (error) {
    console.error(
      "PUBLIC OPEN REQUISITIONS ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch open requisitions",
    });
  }
};

// =====================================
// PUBLIC: GET SINGLE OPEN REQUISITION
// =====================================

const getPublicRequisitionById = async (req, res) => {
  try {
    const requisition = await Requisition.findById(
      req.params.id
    );

    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    await checkAndCloseExpiredRequisition(requisition);

    if (requisition.status !== "Open") {
      return res.status(404).json({
        success: false,
        message: "This job is no longer accepting applications",
      });
    }

    return res.status(200).json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    console.error(
      "PUBLIC REQUISITION BY ID ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job details",
    });
  }
};

const getRequisitionCounts = async (req, res) => {
  try {
    const requisitions = await Requisition.find();

    const updatedRequisitions = await Promise.all(
      requisitions.map(checkAndCloseExpiredRequisition)
    );

    const counts = {
      All: updatedRequisitions.length,
      Open: 0,
      Draft: 0,
      Closed: 0,
      Archived: 0,
    };

    updatedRequisitions.forEach((requisition) => {
      if (counts[requisition.status] !== undefined) {
        counts[requisition.status]++;
      }
    });

    return res.status(200).json({
      success: true,
      data: counts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRequisition = async (req, res) => {
  try {
    const requisition = await Requisition.findById(
      req.params.id
    );

    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: "Requisition not found",
      });
    }

    await checkAndCloseExpiredRequisition(requisition);

    return res.status(200).json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateRequisition = async (req, res) => {
  try {
    const requisition = await Requisition.findById(
      req.params.id
    );

    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: "Requisition not found",
      });
    }

    const updateData = pickAllowedFields(req.body);

    const newOpenings =
      updateData.openings !== undefined
        ? updateData.openings
        : requisition.openings;

    if (
      updateData.status === "Open" &&
      requisition.status === "Closed" &&
      requisition.candidates >= newOpenings
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This requisition is already full. Increase the number of openings before reopening it.",
      });
    }

    Object.assign(requisition, updateData);

    await checkAndCloseExpiredRequisition(requisition);

    await requisition.save();

    if (updateData.status === "Open") {
      await logActivity({
        userId: req.user?.id,
        action: "PUBLISH",
        module: "Job Requisitions",
        description: `Published job ${requisition.role}`,
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 200,
        ipAddress: req.ip,
      });

      req.auditLogged = true;
    }

    return res.status(200).json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteRequisition = async (req, res) => {
  try {
    const requisition = await Requisition.findByIdAndDelete(
      req.params.id
    );

    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: "Requisition not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Requisition deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createRequisition,
  getRequisitions,

  // Public Career Portal
  getPublicOpenRequisitions,
  getPublicRequisitionById,

  // Internal APIs
  getRequisitionCounts,
  getRequisition,
  updateRequisition,
  deleteRequisition,

  getRequisitionsByDate,
  getRequisitionDashboardData,
  checkAndCloseExpiredRequisition,
};

