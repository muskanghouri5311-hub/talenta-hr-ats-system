const mongoose = require("mongoose");

const EXPERIENCE_BANDS = {
  Entry: 1,
  Mid: 3,
  Senior: 5,
  Lead: 7,
};

const requisitionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    openings: {
      type: Number,
      required: true,
      min: [1, "Number of openings must be at least 1"],
    },

    experienceLevel: {
      type: String,
      enum: ["Entry", "Mid", "Senior", "Lead"],
      required: true,
      trim: true,
    },

    minExperienceYears: {
      type: Number,
      required: true,
      min: [0, "Minimum experience cannot be negative"],
    },

    education: {
      type: String,
      default: "",
      trim: true,
    },

    deadline: {
      type: Date,
      default: null,
    },

    salaryMin: {
      type: Number,
      min: [0, "Minimum salary cannot be negative"],
    },

    salaryMax: {
      type: Number,
      min: [0, "Maximum salary cannot be negative"],
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    requirements: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Open", "Draft", "Closed", "Archived"],
      default: "Draft",
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: ["Open", "Draft", "Closed", "Archived"],
          required: true,
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    candidates: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Set minimum experience from experience level
 * when minExperienceYears is not provided, and
 * validate/normalize the numeric value.
 */
requisitionSchema.pre("validate", function () {
  if (
    (this.minExperienceYears === undefined ||
      this.minExperienceYears === null ||
      this.minExperienceYears === "") &&
    this.experienceLevel
  ) {
    this.minExperienceYears = EXPERIENCE_BANDS[this.experienceLevel];
  }

  if (this.minExperienceYears !== undefined && this.minExperienceYears !== null) {
    const numericExperience = Number(this.minExperienceYears);

    if (!Number.isFinite(numericExperience) || numericExperience < 0) {
      throw new Error("minExperienceYears must be a valid non-negative number");
    }

    this.minExperienceYears = numericExperience;
  }
});

/*
 * Add initial status history when requisition is created.
 */
requisitionSchema.pre("save", function () {
  if (this.isNew) {
    this.statusHistory = [
      {
        status: this.status,
        changedAt: this.createdAt || new Date(),
      },
    ];
  }
});

/*
 * Add status history when status changes.
 */
requisitionSchema.pre("save", function () {
  if (!this.isNew && this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });
  }
});

const Requisition = mongoose.model("Requisition", requisitionSchema);

module.exports = Requisition;
module.exports.EXPERIENCE_BANDS = EXPERIENCE_BANDS;