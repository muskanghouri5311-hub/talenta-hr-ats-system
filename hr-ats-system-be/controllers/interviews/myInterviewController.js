const mongoose = require("mongoose");
const Interview = require("../../models/Interview");
const logActivity = require("../../services/audit/auditService");

const getMyInterviews = async (req, res) => {
  try {
    const interviewerId = req.user._id;

    if (!interviewerId) {
      return res.status(401).json({
        success: false,
        message: "Interviewer not authenticated",
      });
    }

    const interviews = await Interview.find({
      interviewerId,
    })
      .populate(
        "candidateId",
        "name email phone role stage score interviewStatus interviews"
      )
      .populate(
        "interviewerId",
        "name email username"
      )
      .sort({
        date: 1,
        time: 1,
      });

    return res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch (error) {
    console.error(
      "GET MY INTERVIEWS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your interviews",
      error: error.message,
    });
  }
};

const getMyInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const interviewerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    const interview = await Interview.findOne({
      _id: id,
      interviewerId,
    })
      .populate(
        "candidateId",
        "name email phone role stage score interviewStatus interviews"
      )
      .populate(
        "interviewerId",
        "name email username"
      );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message:
          "Interview not found or not assigned to you",
      });
    }

    return res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    console.error(
      "GET MY INTERVIEW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch interview",
      error: error.message,
    });
  }
};

const getMyFeedbackSubmitted = async (
  req,
  res
) => {
  try {
    const interviewerId = req.user._id;

    const days = Number(req.query.days) || 7;

    if (days < 1) {
      return res.status(400).json({
        success: false,
        message: "Days must be greater than 0",
      });
    }

    const cutoffDate = new Date();

    cutoffDate.setDate(
      cutoffDate.getDate() - days
    );

    const interviews = await Interview.find({
      interviewerId,

      "feedback.submittedAt": {
        $gte: cutoffDate,
      },
    })
      .populate(
        "candidateId",
        "name email phone role stage score interviewStatus interviews"
      )
      .populate(
        "interviewerId",
        "name email username"
      )
      .sort({
        "feedback.submittedAt": -1,
      });

    return res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch (error) {
    console.error(
      "GET MY FEEDBACK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback history",
      error: error.message,
    });
  }
};

const getRecommendationOptions = async (
  req,
  res
) => {
  try {
    const options = [
      {
        value: "Strong Hire",
        label: "Strong Hire",
      },
      {
        value: "Hire",
        label: "Hire",
      },
      {
        value: "No Hire",
        label: "No Hire",
      },
      {
        value: "Strong No Hire",
        label: "Strong No Hire",
      },
    ];

    return res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error(
      "GET RECOMMENDATION OPTIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch recommendation options",
      error: error.message,
    });
  }
};

const submitMyInterviewFeedback = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const interviewerId = req.user._id;

    const {
      overallRating,
      recommendation,
      technicalStrengths,
      concerns,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    if (
      overallRating === undefined ||
      overallRating === null ||
      overallRating === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Overall rating is required",
      });
    }

    const rating = Number(overallRating);

    if (
      Number.isNaN(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Overall rating must be between 1 and 5",
      });
    }

    const allowedRecommendations = [
      "Strong Hire",
      "Hire",
      "No Hire",
      "Strong No Hire",
    ];

    if (
      !allowedRecommendations.includes(
        recommendation
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid recommendation is required",
      });
    }

    const interview = await Interview.findOne({
      _id: id,
      interviewerId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message:
          "Interview not found or not assigned to you",
      });
    }

    
    if (
      interview.feedback?.submittedAt
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Feedback has already been submitted for this interview",
      });
    }

    if (
      interview.status === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Feedback cannot be submitted for a cancelled interview",
      });
    }

    
    interview.feedback = {
      overallRating: rating,

      recommendation,

      technicalStrengths:
        technicalStrengths || "",

      concerns:
        concerns || "",

      submittedAt: new Date(),
    };

    if (
      interview.status === "Confirmed"
    ) {
      interview.status = "Completed";
    }

       await interview.save();


    const updatedInterview =
      await Interview.findById(
        interview._id
      )
        .populate(
          "candidateId",
          "name email phone role stage score interviewStatus interviews"
        )
        .populate(
          "interviewerId",
          "name email username"
        );

    await logActivity({
      userId: req.user?.id,
      action: "SUBMIT",
      module: "Interviews",
      description: `Submitted feedback for ${updatedInterview.candidateId?.name || "candidate"}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message:
        "Interview feedback submitted successfully",
      data: updatedInterview,
    });
  } catch (error) {
    console.error(
      "SUBMIT MY INTERVIEW FEEDBACK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to submit interview feedback",
      error: error.message,
    });
  }
};

module.exports = {
  getMyInterviews,
  getMyInterviewById,
  getMyFeedbackSubmitted,
  getRecommendationOptions,
  submitMyInterviewFeedback,
};