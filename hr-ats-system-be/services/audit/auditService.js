const AuditLog = require("../../models/AuditLog");

const logActivity = async ({
  userId = null,
  action,
  module,
  description = "",
  method = "",
  endpoint = "",
  statusCode = null,
  ipAddress = "",
  metadata = {},
}) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      module,
      description,
      method,
      endpoint,
      statusCode,
      ipAddress,
      metadata,
    });
  } catch (error) {
    console.error("Audit Log Error:", error.message);
  }
};

module.exports = logActivity;