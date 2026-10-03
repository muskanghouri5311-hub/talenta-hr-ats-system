const AuditLog = require("../../models/AuditLog");

// ===============================
// GET AUDIT LOGS FOR TABLE
// ===============================
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      module,
      action,
      search,
    } = req.query;

    const query = {};

    // Filter by module
    if (module) {
      query.module = module;
    }

    // Filter by action
    if (action) {
      query.action = action;
    }

    // Search
    if (search) {
      query.description = {
        $regex: search,
        $options: "i",
      };
    }

    const currentPage = Number(page);
    const pageLimit = Number(limit);
    const skip = (currentPage - 1) * pageLimit;

    const [logs, totalLogs] = await Promise.all([
      AuditLog.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit),

      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: logs,

      pagination: {
        totalLogs,
        currentPage,
        totalPages: Math.ceil(totalLogs / pageLimit),
        limit: pageLimit,
      },
    });
  } catch (error) {
    console.error("Get Audit Logs Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};


// ===============================
// EXPORT AUDIT LOGS AS CSV
// ===============================
const exportAuditLogs = async (req, res) => {
  try {
    const {
      module,
      action,
      search,
    } = req.query;

    const query = {};

    if (module) {
      query.module = module;
    }

    if (action) {
      query.action = action;
    }

    if (search) {
      query.description = {
        $regex: search,
        $options: "i",
      };
    }

    const logs = await AuditLog.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const csvHeader =
      "User,Action,Module,Description,Method,Endpoint,Status Code,IP Address,Timestamp\n";

    const csvRows = logs
      .map((log) => {
        const userName = log.user?.name || "System";

        return [
          `"${userName}"`,
          `"${log.action}"`,
          `"${log.module}"`,
          `"${log.description || ""}"`,
          `"${log.method || ""}"`,
          `"${log.endpoint || ""}"`,
          `"${log.statusCode || ""}"`,
          `"${log.ipAddress || ""}"`,
          `"${log.createdAt.toISOString()}"`,
        ].join(",");
      })
      .join("\n");

    const csv = csvHeader + csvRows;

    res.header(
      "Content-Type",
      "text/csv"
    );

    res.attachment("audit-logs.csv");

    return res.send(csv);
  } catch (error) {
    console.error("Export Audit Logs Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
    });
  }
};


module.exports = {
  getAuditLogs,
  exportAuditLogs,
};