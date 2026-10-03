const mongoose = require("mongoose");

const atsResultSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },

    requisitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requisition",
      required: false,
      default: null,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    scoreInterpretation: {
      type: String,
      default: "Low ATS-friendliness; major improvements recommended",
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    detectedSkills: {
      type: [String],
      default: [],
    },

    educationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    candidateExperience: {
      type: Number,
      default: 0,
      min: 0,
    },

    candidateEducation: {
      type: String,
      default: "",
    },

    scoring: {
      parsing: {
        score: {
          type: Number,
          default: 0,
          min: 0,
          max: 25,
        },

        max: {
          type: Number,
          default: 25,
        },

        details: {
          type: [String],
          default: [],
        },
      },

      structure: {
        score: {
          type: Number,
          default: 0,
          min: 0,
          max: 20,
        },

        max: {
          type: Number,
          default: 20,
        },

        details: {
          type: [String],
          default: [],
        },
      },

      formatting: {
        score: {
          type: Number,
          default: 0,
          min: 0,
          max: 15,
        },

        max: {
          type: Number,
          default: 15,
        },

        details: {
          type: [String],
          default: [],
        },
      },

      skills: {
        score: {
          type: Number,
          default: 0,
          min: 0,
          max: 15,
        },

        max: {
          type: Number,
          default: 15,
        },

        details: {
          type: [String],
          default: [],
        },
      },

      experience: {
        score: {
          type: Number,
          default: 0,
          min: 0,
          max: 15,
        },

        max: {
          type: Number,
          default: 15,
        },

        details: {
          type: [String],
          default: [],
        },
      },

      education: {
        score: {
          type: Number,
          default: 0,
          min: 0,
          max: 5,
        },

        max: {
          type: Number,
          default: 5,
        },

        details: {
          type: [String],
          default: [],
        },
      },

      contact: {
        score: {
          type: Number,
          default: 0,
          min: 0,
          max: 5,
        },

        max: {
          type: Number,
          default: 5,
        },

        details: {
          type: [String],
          default: [],
        },
      },
    },

    explanation: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ATSResult",
  atsResultSchema
);