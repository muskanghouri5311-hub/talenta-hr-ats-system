const mongoose = require("mongoose");

// Permission Schema
const permissionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      enum: [
        "dashboard",
        "jobRequisitions",
        "candidates",
        "atsRanking",
        "interviews",
        "offerLetters",
        "users",
        "departments",
        "roles",
        "auditLogs",
        "reports",
      ],
    },

    view: {
      type: Boolean,
      default: false,
    },

    create: {
      type: Boolean,
      default: false,
    },

    edit: {
      type: Boolean,
      default: false,
    },

    delete: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

// Role Schema
const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: true,
      unique: true,

    },
    
    description: {
    type: String,
    required: true,
    trim: true,
},

    permissions: {
      type: [permissionSchema],
      default: [],
    },

    isSystemRole: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Role", roleSchema); 