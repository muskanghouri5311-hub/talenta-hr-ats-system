const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },

    template: {
      type: String,
      enum: [
        "Contract",
        "Standard Full-Time",
        "Internship",
      ],
      required: true,
    },

    joiningDate: {
      type: Date,
      required: true,
    },

    salary: {
      type: Number,
      required: true,
    },

    probation: {
      type: String,
      required: true,
    },

    workingType: {
      type: String,
      enum: ["On-Site", "Remote", "Hybrid"],
      required: true,
    },

    acknowledgeByDate: {
      type: Date,
      required: true,
    },

    note: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Sent",
        "Accepted",
        "Rejected",
      ],
      default: "Sent",
    },

    sentAt: {
      type: Date,
      default: Date.now,
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
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Offer",
  offerSchema
);