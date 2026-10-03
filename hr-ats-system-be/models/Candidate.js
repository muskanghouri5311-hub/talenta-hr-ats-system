const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    requisitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requisition",
      required: true,
    },

    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    experience: {
      type: Number,
      default: 0,
      min: [0, "Experience cannot be negative"],
    },

    education: {
      type: String,
      default: "",
      trim: true,
    },

    coverNote: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // NEW: APPLY NOW EXTRA FIELDS
    // =====================================================

    currentSalary: {
      type: Number,
      default: null,
      min: [0, "Current salary cannot be negative"],
    },

    expectedSalary: {
      type: Number,
      default: null,
      min: [0, "Expected salary cannot be negative"],
    },

    noticePeriod: {
      type: String,
      enum: [
        "Immediate",
        "15 Days",
        "1 Month",
        "2 Months",
        "More than 2 Months",
      ],
      default: "Immediate",
    },

    currentCity: {
      type: String,
      default: "",
      trim: true,
    },

    willingToRelocate: {
      type: Boolean,
      default: false,
    },

    // =====================================================

    skills: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    resumeUrl: {
      type: String,
      default: "",
    },

    resumePublicId: {
      type: String,
      default: "",
    },

    originalResumeName: {
      type: String,
      default: "",
    },

    cvText: {
      type: String,
      default: "",
    },

    resumeText: {
      type: String,
      default: "",
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    stage: {
      type: String,
      enum: [
        "Applied",
        "Screening",
        "Shortlisted",
        "Interview",
        "Offer Sent",
        "Hired",
        "Rejected",
      ],
      default: "Applied",
    },

    hiredAt: {
      type: Date,
      default: null,
    },

    stageHistory: [
      {
        stage: {
          type: String,
          enum: [
            "Applied",
            "Screening",
            "Shortlisted",
            "Interview",
            "Offer Sent",
            "Hired",
            "Rejected",
          ],
          required: true,
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    screening: {
      status: {
        type: String,
        enum: ["Pending", "Passed", "Failed", "Hold"],
        default: "Pending",
      },

      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      notes: {
        type: String,
        default: "",
      },

      screenedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      screenedAt: {
        type: Date,
        default: null,
      },
    },

    interviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Interview",
      },
    ],

    interviewStatus: {
      type: String,
      enum: [
        "Not Scheduled",
        "Scheduled",
        "Passed",
        "Failed",
        "Hold",
      ],
      default: "Not Scheduled",
    },

    offer: {
      position: {
        type: String,
        default: "",
      },

      salary: {
        type: String,
        default: "",
      },

      joiningDate: {
        type: Date,
        default: null,
      },

      employmentType: {
        type: String,
        default: "",
      },

      notes: {
        type: String,
        default: "",
      },

      status: {
        type: String,
        enum: ["Draft", "Sent", "Accepted", "Rejected"],
        default: "Draft",
      },

      sentAt: {
        type: Date,
        default: null,
      },

      acceptedAt: {
        type: Date,
        default: null,
      },

      rejectedAt: {
        type: Date,
        default: null,
      },
    },

    rejection: {
      reason: {
        type: String,
        default: "",
      },

      rejectedAt: {
        type: Date,
        default: null,
      },

      rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    notes: [
      {
        author: {
          type: String,
          default: "",
        },

        text: {
          type: String,
          default: "",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

candidateSchema.pre("save", function () {
  if (
    this.isModified("stage") &&
    this.stage === "Hired" &&
    !this.hiredAt
  ) {
    this.hiredAt = new Date();
  }
});

const Candidate = mongoose.model("Candidate", candidateSchema);

module.exports = Candidate;