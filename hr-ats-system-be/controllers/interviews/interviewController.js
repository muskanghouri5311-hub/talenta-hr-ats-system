const mongoose = require("mongoose");

const Interview = require("../../models/Interview");
const Candidate = require("../../models/Candidate");
const logActivity = require("../../services/audit/auditService");
const sendEmail = require("../../config/sendEmail");

// =====================================================
// HELPERS
// =====================================================

const COMPANY_NAME = "Compilex Technologies";

const formatInterviewDate = (dateStr) => {
  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) {
    return dateStr;
  }

  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const buildScheduleEmail = ({
  candidateName,
  jobTitle,
  date,
  time,
  mode,
  location,
  interviewerName,
  hrName,
}) => {
  return `Subject: Interview Invitation – ${jobTitle}

Dear ${candidateName},

Thank you for your interest in the ${jobTitle} role at ${COMPANY_NAME}.
We are pleased to invite you for an interview to discuss your experience, skills, and suitability for the position.

Interview Details:
Date: ${date}
Time: ${time}
Mode: ${mode}
Location/Meeting Link: ${location}
Interviewer: ${interviewerName}

Please confirm your availability for the scheduled time. If you have any questions or need to request a different time, please let us know.

We look forward to speaking with you.

Best regards,
${hrName}
HR Department
${COMPANY_NAME}`;
};

const buildRescheduleEmail = ({
  candidateName,
  jobTitle,
  date,
  time,
  mode,
  location,
  hrName,
}) => {
  return `Subject: Interview Rescheduling – ${jobTitle}

Dear ${candidateName},

We would like to inform you that your interview for the ${jobTitle} position has been rescheduled.

Updated Interview Details:
Date: ${date}
Time: ${time}
Mode: ${mode}
Location/Meeting Link: ${location}

We apologize for any inconvenience this change may cause. Please confirm your availability for the updated schedule.

We look forward to speaking with you.

Best regards,
${hrName}
HR Department
${COMPANY_NAME}`;
};

// =====================================================
// SCHEDULE INTERVIEW
// =====================================================

const scheduleInterview = async (req, res) => {
  try {
    const {
      candidateId,
      round,
      mode,
      date,
      time,
      duration,
      interviewerId,
      location,
      notes,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: "Candidate is required",
      });
    }

    if (!round) {
      return res.status(400).json({
        success: false,
        message: "Interview round is required",
      });
    }

    if (!mode) {
      return res.status(400).json({
        success: false,
        message: "Interview mode is required",
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Interview date is required",
      });
    }

    if (!time) {
      return res.status(400).json({
        success: false,
        message: "Interview time is required",
      });
    }

    if (!duration) {
      return res.status(400).json({
        success: false,
        message: "Interview duration is required",
      });
    }

    if (!interviewerId) {
      return res.status(400).json({
        success: false,
        message: "Interviewer is required",
      });
    }

    // =================================================
    // CHECK CANDIDATE
    // =================================================

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    // =================================================
    // CREATE INTERVIEW
    // =================================================

    const interview = await Interview.create({
      candidateId,
      interviewerId,
      round,
      mode,
      date,
      time,
      duration: Number(duration),
      location: location || "",
      notes: notes || "",
      status: "Confirmed",
    });

    // =================================================
    // UPDATE CANDIDATE
    // =================================================

    candidate.stage = "Interview";
    candidate.interviewStatus = "Scheduled";

    if (!Array.isArray(candidate.interviews)) {
      candidate.interviews = [];
    }

    candidate.interviews.push(interview._id);

    await candidate.save();

    // =================================================
    // POPULATE INTERVIEW
    // =================================================

    const populatedInterview = await Interview.findById(
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

    // =================================================
    // SEND SCHEDULE EMAIL
    // =================================================

    let emailWarning = null;

    try {
      const emailBody = buildScheduleEmail({
        candidateName: candidate.name,
        jobTitle: candidate.role,
        date: formatInterviewDate(date),
        time,
        mode,
        location: location || "To be shared",
        interviewerName:
          populatedInterview.interviewerId?.name || "Our team",
        hrName: req.user?.name || "HR Team",
      });

      await sendEmail({
        email: candidate.email,
        subject: `Interview Invitation – ${candidate.role}`,
        message: emailBody,
      });
    } catch (emailError) {
      console.error("SCHEDULE INTERVIEW EMAIL ERROR:", emailError);
      emailWarning =
        "Interview scheduled, but the notification email could not be sent.";
    }

    await logActivity({
      userId: req.user?.id,
      action: "SCHEDULE",
      module: "Interviews",
      description: `Scheduled interview for ${populatedInterview.candidateId?.name || "candidate"}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 201,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(201).json({
      success: true,
      message: emailWarning
        ? "Interview scheduled, but email failed to send."
        : "Interview scheduled successfully",
      warning: emailWarning,
      data: populatedInterview,
    });
  } catch (error) {
    console.error(
      "SCHEDULE INTERVIEW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to schedule interview",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL INTERVIEWS
// =====================================================

const getAllInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find()
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
      "GET INTERVIEWS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch interviews",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE INTERVIEW
// =====================================================

const getInterview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    const interview = await Interview.findById(id)
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
        message: "Interview not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    console.error(
      "GET INTERVIEW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch interview",
      error: error.message,
    });
  }
};

// =====================================================
// GET CANDIDATE INTERVIEWS
// =====================================================

const getCandidateInterviews = async (
  req,
  res
) => {
  try {
    const { candidateId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        candidateId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    const interviews = await Interview.find({
      candidateId,
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
        date: -1,
        time: -1,
      });

    return res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch (error) {
    console.error(
      "GET CANDIDATE INTERVIEWS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch candidate interviews",
      error: error.message,
    });
  }
};

// =====================================================
// CONFIRM INTERVIEW
// =====================================================

const confirmInterview = async (
  req,
  res
) => {
  try {
    const interview = await Interview.findById(
      req.params.id
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status === "Confirmed") {
      return res.status(200).json({
        success: true,
        message:
          "Interview is already confirmed",
        data: interview,
      });
    }

    if (
      interview.status === "Completed" ||
      interview.status === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Completed or cancelled interview cannot be confirmed",
      });
    }

    interview.status = "Confirmed";

    await interview.save();

    const candidate = await Candidate.findById(
      interview.candidateId
    );

    if (candidate) {
      candidate.interviewStatus = "Scheduled";
      await candidate.save();
    }

    const updatedInterview =
      await Interview.findById(interview._id)
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
      action: "UPDATE",
      module: "Interviews",
      description: `Confirmed interview for ${updatedInterview.candidateId?.name || "candidate"}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message:
        "Interview confirmed successfully",
      data: updatedInterview,
    });
  } catch (error) {
    console.error(
      "CONFIRM INTERVIEW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to confirm interview",
      error: error.message,
    });
  }
};

// =====================================================
// COMPLETE INTERVIEW
// =====================================================

const completeInterview = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    const interview =
      await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled interview cannot be completed",
      });
    }

    if (interview.status === "Completed") {
      return res.status(200).json({
        success: true,
        message:
          "Interview is already completed",
        data: interview,
      });
    }

    if (interview.status !== "Confirmed") {
      return res.status(400).json({
        success: false,
        message:
          "Only confirmed interviews can be completed",
      });
    }

    // Only interview session status changes.
    // Candidate pass/fail is handled separately.

    interview.status = "Completed";

    await interview.save();

    const updatedInterview =
      await Interview.findById(interview._id)
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
      action: "UPDATE",
      module: "Interviews",
      description: `Marked interview completed for ${updatedInterview.candidateId?.name || "candidate"}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message:
        "Interview marked as completed",
      data: updatedInterview,
    });
  } catch (error) {
    console.error(
      "COMPLETE INTERVIEW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to complete interview",
      error: error.message,
    });
  }
};

// =====================================================
// RESCHEDULE INTERVIEW
// =====================================================

const rescheduleInterview = async (
  req,
  res
) => {
  try {
    const { date, time } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message:
          "New interview date is required",
      });
    }

    if (!time) {
      return res.status(400).json({
        success: false,
        message:
          "New interview time is required",
      });
    }

    const interview =
      await Interview.findById(
        req.params.id
      );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (
      interview.status !== "Confirmed" &&
      interview.status !== "Completed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only confirmed or completed interviews can be rescheduled",
      });
    }

    interview.date = date;
    interview.time = time;
    interview.status = "Confirmed";

    await interview.save();

    const candidate =
      await Candidate.findById(
        interview.candidateId
      );

    if (candidate) {
      candidate.interviewStatus = "Scheduled";
      candidate.stage = "Interview";

      await candidate.save();
    }

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

    // =================================================
    // SEND RESCHEDULE EMAIL
    // =================================================

    let emailWarning = null;

    if (candidate) {
      try {
        const emailBody = buildRescheduleEmail({
          candidateName: candidate.name,
          jobTitle: candidate.role,
          date: formatInterviewDate(date),
          time,
          mode: updatedInterview.mode,
          location: updatedInterview.location || "To be shared",
          hrName: req.user?.name || "HR Team",
        });

        await sendEmail({
          email: candidate.email,
          subject: `Interview Rescheduling – ${candidate.role}`,
          message: emailBody,
        });
      } catch (emailError) {
        console.error(
          "RESCHEDULE INTERVIEW EMAIL ERROR:",
          emailError
        );
        emailWarning =
          "Interview rescheduled, but the notification email could not be sent.";
      }
    }

    await logActivity({
      userId: req.user?.id,
      action: "UPDATE",
      module: "Interviews",
      description: `Rescheduled interview for ${updatedInterview.candidateId?.name || "candidate"}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message: emailWarning
        ? "Interview rescheduled, but email failed to send."
        : "Interview rescheduled successfully",
      warning: emailWarning,
      data: updatedInterview,
    });
  } catch (error) {
    console.error(
      "RESCHEDULE INTERVIEW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reschedule interview",
      error: error.message,
    });
  }
};

// =====================================================
// CANCEL INTERVIEW
// =====================================================

const cancelInterview = async (
  req,
  res
) => {
  try {
    const interview =
      await Interview.findById(
        req.params.id
      );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Interview is already cancelled",
      });
    }

    interview.status = "Cancelled";

    await interview.save();

    const candidate =
      await Candidate.findById(
        interview.candidateId
      );

    if (candidate) {
      candidate.interviewStatus = "Hold";

      await candidate.save();
    }

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
      action: "CANCEL",
      module: "Interviews",
      description: `Cancelled interview for ${updatedInterview.candidateId?.name || "candidate"}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message:
        "Interview cancelled successfully",
      data: updatedInterview,
    });
  } catch (error) {
    console.error(
      "CANCEL INTERVIEW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to cancel interview",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  scheduleInterview,
  getAllInterviews,
  getInterview,
  getCandidateInterviews,
  confirmInterview,
  completeInterview,
  rescheduleInterview,
  cancelInterview,
};