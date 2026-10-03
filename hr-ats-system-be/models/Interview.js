const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {

    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },

    round: {
      type: String,
      enum: [
        "Technical",
        "Final",
      ],
      required: true,
    },

    
    mode: {
      type: String,
      enum: [
        "Video Call",
        "Onsite",
        "Phone Call",
      ],
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },


    duration: {
      type: Number,
      required: true,
    },

    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    location: {
      type: String,
      default: "",
    },

    
    notes: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Confirmed",
        "Completed",
        "Cancelled",
      ],
      default: "Confirmed",
    },

    feedback: {
      overallRating: {
        type: Number,
        min: 1,
        max: 5,
      },

      recommendation: {
        type: String,
        enum: [
          "Strong Hire",
          "Hire",
          "No Hire",
          "Strong No Hire",
        ],
      },

      technicalStrengths: {
        type: String,
        default: "",
      },

      concerns: {
        type: String,
        default: "",
      },

      submittedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Interview",
  interviewSchema
);