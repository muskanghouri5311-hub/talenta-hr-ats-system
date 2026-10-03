const mongoose = require("mongoose");
const Candidate = require("../../models/Candidate");
const Interview = require("../../models/Interview");
const Requisition = require("../../models/Requisition");
const ATSResult = require("../../models/ATSResult");
const logActivity = require("../../services/audit/auditService");

const {
  calculateATSScore,
  getAutoStage,
} = require("../../services/ats/atsScoringService");

const {
  extractCVText,
  extractSkillsFromText,
} = require("../../services/ats/cvParserService");

const uploadToCloudinary = require("../../utils/uploadToCloudinary");

// =====================================================
// APPLY NOW
// POST /api/candidates/apply
// =====================================================

const applyNow = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      requisitionId,
      experience,
      education,
      tags,
      coverNote,
      currentSalary,
      expectedSalary,
      noticePeriod,
      currentCity,
      willingToRelocate,
    } = req.body;

    // -----------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email and role are required",
      });
    }

    if (!requisitionId) {
      return res.status(400).json({
        success: false,
        message: "Requisition is required",
      });
    }

    // -----------------------------------------
    // FIND REQUISITION
    // -----------------------------------------

    const requisition = await Requisition.findById(requisitionId);

    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: "Job requisition not found",
      });
    }

    // -----------------------------------------
    // CHECK DEADLINE
    // -----------------------------------------

    if (
      requisition.deadline &&
      new Date() >= new Date(requisition.deadline)
    ) {
      if (requisition.status === "Open") {
        requisition.status = "Closed";
        await requisition.save();
      }

      return res.status(400).json({
        success: false,
        message: "This job application deadline has passed.",
      });
    }

    // -----------------------------------------
    // CHECK REQUISITION STATUS
    // -----------------------------------------

    if (requisition.status !== "Open") {
      return res.status(400).json({
        success: false,
        message: "This job is not currently open for applications.",
      });
    }

    // -----------------------------------------
    // CHECK OPENINGS
    // -----------------------------------------

    if (requisition.candidates >= requisition.openings) {
      return res.status(400).json({
        success: false,
        message:
          "This job has reached its maximum number of openings.",
      });
    }

    // -----------------------------------------
    // CHECK RESUME
    // -----------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload your PDF resume.",
      });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Only PDF resumes are allowed.",
      });
    }

    // -----------------------------------------
    // NORMALIZE EMAIL
    // -----------------------------------------

    const normalizedEmail = email.trim().toLowerCase();

    const existingCandidate = await Candidate.exists({
      email: normalizedEmail,
    });

    if (existingCandidate) {
      return res.status(409).json({
        success: false,
        message:
          "A candidate with this email has already applied.",
      });
    }

    // -----------------------------------------
    // VALIDATE NEW FIELDS
    // (FormData always sends strings, so parse
    //  and validate before hitting the DB)
    // -----------------------------------------

    let parsedCurrentSalary = null;
    let parsedExpectedSalary = null;

    if (currentSalary !== undefined && currentSalary !== "") {
      parsedCurrentSalary = Number(currentSalary);

      if (!Number.isFinite(parsedCurrentSalary) || parsedCurrentSalary < 0) {
        return res.status(400).json({
          success: false,
          message: "Current salary must be a valid non-negative number.",
        });
      }
    }

    if (expectedSalary !== undefined && expectedSalary !== "") {
      parsedExpectedSalary = Number(expectedSalary);

      if (!Number.isFinite(parsedExpectedSalary) || parsedExpectedSalary < 0) {
        return res.status(400).json({
          success: false,
          message: "Expected salary must be a valid non-negative number.",
        });
      }
    }

    const allowedNoticePeriods = [
      "Immediate",
      "15 Days",
      "1 Month",
      "2 Months",
      "More than 2 Months",
    ];

    if (noticePeriod && !allowedNoticePeriods.includes(noticePeriod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notice period value.",
      });
    }

    // Boolean sent via FormData arrives as the string "true"/"false"
    const parsedWillingToRelocate =
      willingToRelocate === true || willingToRelocate === "true";

    // -----------------------------------------
    // EXTRACT CV TEXT
    // -----------------------------------------

    let resumeText = "";

    try {
      resumeText = await extractCVText(req.file.buffer);
    } catch (cvError) {
      console.error("CV PARSING ERROR:", cvError);

      return res.status(400).json({
        success: false,
        message: "Unable to read the uploaded PDF resume.",
        error: cvError.message,
      });
    }

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "No readable text found in the uploaded PDF.",
      });
    }

    // -----------------------------------------
    // EXTRACT SKILLS
    // -----------------------------------------

    const candidateSkills =
      extractSkillsFromText(resumeText);

    // -----------------------------------------
    // UPLOAD RESUME TO CLOUDINARY
    // -----------------------------------------

    let resumeUrl = "";
    let resumePublicId = "";

    try {
      const cloudinaryResult =
        await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname
        );

      resumeUrl = cloudinaryResult.secure_url;
      resumePublicId = cloudinaryResult.public_id;
    } catch (cloudinaryError) {
      console.error(
        "CLOUDINARY UPLOAD ERROR:",
        cloudinaryError
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to upload resume to Cloudinary.",
        error: cloudinaryError.message,
      });
    }

    // -----------------------------------------
    // ATOMICALLY INCREASE CANDIDATE COUNT
    // -----------------------------------------

    const updatedRequisition =
      await Requisition.findOneAndUpdate(
        {
          _id: requisitionId,
          status: "Open",
          $expr: {
            $lt: ["$candidates", "$openings"],
          },
        },
        {
          $inc: {
            candidates: 1,
          },
        },
        {
          new: true,
        }
      );

    if (!updatedRequisition) {
      return res.status(400).json({
        success: false,
        message:
          "This job has reached its maximum number of openings.",
      });
    }

    // -----------------------------------------
    // CREATE CANDIDATE
    // -----------------------------------------

    let candidate;

    try {
      candidate = await Candidate.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone || "",
        role: role.trim(),
        requisitionId,

        experience: experience || "",
        education: education || "",
        coverNote: coverNote || "",

        currentSalary: parsedCurrentSalary,
        expectedSalary: parsedExpectedSalary,
        noticePeriod: noticePeriod || "Immediate",
        currentCity: currentCity || "",
        willingToRelocate: parsedWillingToRelocate,

        skills: candidateSkills,
        tags: Array.isArray(tags) ? tags : [],

        resumeUrl,
        resumePublicId,
        originalResumeName:
          req.file.originalname,

        cvText: resumeText.trim(),
        resumeText: resumeText.trim(),

        score: 0,
        stage: "Applied",

        screening: {
          status: "Pending",
          score: 0,
          notes: "",
          screenedBy: null,
          screenedAt: null,
        },

        interviews: [],
        interviewStatus: "Not Scheduled",

        offer: {
          position: "",
          salary: "",
          joiningDate: null,
          employmentType: "",
          notes: "",
          status: "Draft",
          sentAt: null,
          acceptedAt: null,
          rejectedAt: null,
        },

        rejection: {
          reason: "",
          rejectedAt: null,
          rejectedBy: null,
        },

        notes: coverNote
          ? [
            {
              author: "Candidate",
              text: coverNote,
            },
          ]
          : [],
      });
    } catch (candidateError) {
      // If candidate creation fails after incrementing count,
      // rollback the requisition candidate count.

      await Requisition.findByIdAndUpdate(
        requisitionId,
        {
          $inc: {
            candidates: -1,
          },
        }
      );

      throw candidateError;
    }

    // -----------------------------------------
    // ATS CALCULATION
    // -----------------------------------------

    let atsResult = null;

    try {
      const result = await calculateATSScore(
        candidate._id
      );

      atsResult =
        await ATSResult.findOneAndUpdate(
          {
            candidateId: result.candidateId,
            requisitionId: result.requisitionId,
          },
          {
            candidateId: result.candidateId,
            requisitionId: result.requisitionId,
            score: result.score,
            scoreInterpretation:
              result.scoreInterpretation || "",
            matchedSkills:
              result.matchedSkills,
            missingSkills:
              result.missingSkills,
            experienceMatch:
              result.experienceMatch,
            roleMatch:
              result.roleMatch,
            educationMatch:
              result.educationMatch,
            educationScore:
              result.educationScore,
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );

      candidate.score = result.score;

      const autoStage = getAutoStage(
        result.score,
        candidate.stage
      );

      candidate.stage = autoStage;

      candidate.screening.score =
        result.score;

      await candidate.save();
    } catch (atsError) {
      console.error(
        "ATS SCORE CALCULATION ERROR:",
        atsError
      );
    }

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Application submitted successfully",
      data: candidate,
      atsResult,
    });
  } catch (error) {
    console.error(
      "APPLY NOW ERROR:",
      error
    );

    if (
      error?.code === 11000 &&
      error?.keyPattern?.email
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A candidate with this email has already applied.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL CANDIDATES
// GET /api/candidates
// GET /api/candidates?requisitionId=<id>
// GET /api/candidates?search=ali
//
// Phase 3 fix: this used to always return every
// candidate and let the frontend filter client-side.
// Now it supports:
//   - requisitionId: scope results to one job (used by
//     the Candidate Pipeline job selector so the pipeline
//     is actually job-scoped server-side, not just
//     filtered in the browser after fetching everyone).
//   - search: case-insensitive partial match across
//     name, email, phone, skills and role (used by the
//     global navbar search).
// Both can be combined.
// =====================================================

const getAllCandidates = async (req, res) => {
  try {
    const { requisitionId, search } = req.query;

    const filter = {};

    if (requisitionId) {
      if (!mongoose.Types.ObjectId.isValid(requisitionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid requisition ID",
        });
      }

      filter.requisitionId = requisitionId;
    }

    if (search && search.trim()) {
      const escaped = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const regex = new RegExp(escaped, "i");

      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { role: regex },
        { skills: regex },
      ];
    }

    const candidates = await Candidate.find(filter)
      .populate(
        "requisitionId",
        "role department openings status"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    console.error(
      "GET ALL CANDIDATES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch candidates",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE CANDIDATE
// GET /api/candidates/:id
// =====================================================

const getCandidate = async (req, res) => {
  try {
    const candidate =
      await Candidate.findById(req.params.id)
        .populate(
          "requisitionId",
          "role department type location openings status"
        )
        .populate(
          "interviews"
        );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error(
      "GET CANDIDATE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch candidate",
      error: error.message,
    });
  }
};

// =====================================================
// COMPLETE SCREENING
// PATCH /api/candidates/:id/screening
// =====================================================

const completeScreening = async (req, res) => {
  try {
    const {
      status,
      score = 0,
      notes = "",
    } = req.body;

    const allowedStatuses = [
      "Passed",
      "Failed",
      "Hold",
    ];

    const numericScore = Number(score);

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid screening status",
      });
    }

    if (
      !Number.isFinite(numericScore) ||
      numericScore < 0 ||
      numericScore > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Screening score must be between 0 and 100",
      });
    }

    const candidate =
      await Candidate.findById(
        req.params.id
      );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message:
          "Candidate not found",
      });
    }

    // -----------------------------------------
    // UPDATE SCREENING
    // -----------------------------------------

    candidate.screening.status =
      status;

    candidate.screening.score =
      numericScore;

    candidate.screening.notes =
      notes;

    candidate.screening.screenedBy =
      req.user?._id || null;

    candidate.screening.screenedAt =
      new Date();

    // -----------------------------------------
    // UPDATE STAGE
    // -----------------------------------------

    if (status === "Passed") {
      candidate.stage =
        "Shortlisted";
    } else if (status === "Failed") {
      candidate.stage =
        "Rejected";

      candidate.rejection.reason =
        notes || "Failed screening";

      candidate.rejection.rejectedAt =
        new Date();

      if (req.user?._id) {
        candidate.rejection.rejectedBy =
          req.user._id;
      }
    } else {
      candidate.stage =
        "Screening";
    }

        await candidate.save();

    await logActivity({
      userId: req.user?.id,
      action: "UPDATE",
      module: "Candidate Pipeline",
      description: `Completed screening for ${candidate.name} (${status})`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message:
        `Screening completed with status ${status}`,
      data: candidate,
    });
  } catch (error) {
    console.error(
      "COMPLETE SCREENING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to complete screening",
      error: error.message,
    });
  }
};

// =====================================================
// REJECT CANDIDATE
// PATCH /api/candidates/:id/reject
// =====================================================

const rejectCandidate = async (req, res) => {
  try {
    const candidate =
      await Candidate.findById(
        req.params.id
      );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message:
          "Candidate not found",
      });
    }

    candidate.stage = "Rejected";

    candidate.rejection.reason =
      req.body?.reason || "";

    candidate.rejection.rejectedAt =
      new Date();

    if (req.user?._id) {
      candidate.rejection.rejectedBy =
        req.user._id;
    }

        await candidate.save();

    await logActivity({
      userId: req.user?.id,
      action: "REJECT",
      module: "Candidate Pipeline",
      description: `Rejected candidate ${candidate.name}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message:
        "Candidate rejected successfully",
      data: candidate,
    });
  } catch (error) {
    console.error(
      "REJECT CANDIDATE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reject candidate",
      error: error.message,
    });
  }
};

const moveCandidateStage = async (req, res) => {
  try {
    const { stage } = req.body;

    const allowedStages = [
      "Applied", "Screening", "Shortlisted", "Interview",
      "Offer Sent", "Hired", "Rejected",
    ];

    if (!stage) {
      return res.status(400).json({ success: false, message: "Stage is required" });
    }
    if (!allowedStages.includes(stage)) {
      return res.status(400).json({ success: false, message: "Invalid candidate stage" });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const oldStage =
      candidate.stage;

    candidate.stage = stage;
    if (stage === "Hired" && !candidate.recruiterId && req.user?._id) {
      candidate.recruiterId = req.user._id;
    }

        await candidate.save();

    await logActivity({
      userId: req.user?.id,
      action: "UPDATE",
      module: "Candidate Pipeline",
      description: `Moved ${candidate.name} from ${oldStage} to ${stage}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message:
        `Candidate moved from ${oldStage} to ${stage}`,
      data: candidate,
    });
  } catch (error) {
    console.error(
      "MOVE STAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update candidate stage",
      error: error.message,
    });
  }
};

const updateInterviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, rejectionReason } = req.body;

    const allowedStatuses = ["Passed", "Failed", "Hold", "Scheduled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview status",
      });
    }

    const candidate = await Candidate.findById(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    candidate.interviewStatus = status;

    // -----------------------------------------
    // FAILED
    // -----------------------------------------
    if (status === "Failed") {
      candidate.stage = "Rejected";
      candidate.rejection.reason = rejectionReason || "Failed interview round";
      candidate.rejection.rejectedAt = new Date();
      if (req.user?._id) {
        candidate.rejection.rejectedBy = req.user._id;
      }
    }

    // -----------------------------------------
    // HOLD
    // -----------------------------------------
    else if (status === "Hold") {
      candidate.stage = "Interview";
    }

   // -----------------------------------------
// PASSED
// -----------------------------------------
else if (status === "Passed") {
  const activeInterview = await Interview.findOne({
    candidateId: candidate._id,
    status: "Confirmed",
  }).sort({ createdAt: -1 });

  if (activeInterview) {
    activeInterview.status = "Completed";
    await activeInterview.save();
  }
}

    // -----------------------------------------
    // SCHEDULED
    // -----------------------------------------
    else if (status === "Scheduled") {
      candidate.stage = "Interview";
    }

    // -----------------------------------------
    // ADD NOTE
    // -----------------------------------------
    if (notes && notes.trim()) {
      candidate.notes.push({
        author: req.user?.name || "Interviewer",
        text: `Interview Status updated to ${status}. Note: ${notes.trim()}`,
      });
    }

        await candidate.save();

    await logActivity({
      userId: req.user?.id,
      action: "UPDATE",
      module: "Interviews",
      description: `Updated interview status to ${status} for ${candidate.name}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message: `Interview status updated to ${status}. Stage changed to ${candidate.stage}`,
      data: candidate,
    });

  } catch (error) {
    console.error("UPDATE INTERVIEW STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update interview status",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE OFFER STATUS
// PATCH /api/candidates/:id/offer-status
// =====================================================

const updateOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const allowedStatuses = ["Sent", "Accepted", "Rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer status",
      });
    }

    const candidate = await Candidate.findById(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    // -----------------------------------------
    // UPDATE OFFER
    // -----------------------------------------
    candidate.offer.status = status;

    // -----------------------------------------
    // ACCEPTED
    // -----------------------------------------
    if (status === "Accepted") {
      candidate.stage = "Hired";
      candidate.offer.acceptedAt = new Date();

      // Needed for Reports & Analytics (recruiter performance):
      // hiredAt and recruiterId must be set, otherwise the candidate
      // never shows up in the report query (it requires these non-null).
      candidate.hiredAt = new Date();

      // If recruiterId isn't already set, default to the logged-in user.
      // If it's already assigned via another flow, don't overwrite it.
      if (!candidate.recruiterId && req.user?._id) {
        candidate.recruiterId = req.user._id;
      }
    }

    // -----------------------------------------
    // REJECTED
    // -----------------------------------------
    else if (status === "Rejected") {
      candidate.stage = "Rejected";
      candidate.offer.rejectedAt = new Date();
      candidate.rejection.reason = rejectionReason || "Offer rejected by candidate";
      candidate.rejection.rejectedAt = new Date();
      if (req.user?._id) {
        candidate.rejection.rejectedBy = req.user._id;
      }
    }

    // -----------------------------------------
    // SENT
    // -----------------------------------------
    else if (status === "Sent") {
      candidate.stage = "Offer Sent";
      candidate.offer.sentAt = candidate.offer.sentAt || new Date();
    }

        await candidate.save();

    await logActivity({
      userId: req.user?.id,
      action: "UPDATE",
      module: "Offer Letters",
      description: `${candidate.name}'s offer marked as ${status}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(200).json({
      success: true,
      message: `Offer status updated to ${status}. Stage changed to ${candidate.stage}`,
      data: candidate,
    });
  } catch (error) {
    console.error("UPDATE OFFER STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update offer status",
      error: error.message,
    });
  }
};
// =====================================================
// ADD CANDIDATE NOTE
// POST /api/candidates/:id/notes
// =====================================================

const addCandidateNote =
  async (req, res) => {
    try {
      const {
        author,
        text,
      } = req.body;

      if (
        !text ||
        !text.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Note text is required",
        });
      }

      const candidate =
        await Candidate.findById(
          req.params.id
        );

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found",
        });
      }

      candidate.notes.push({
        author:
          author ||
          req.user?.name ||
          "Recruiter",

        text:
          text.trim(),
      });

            await candidate.save();

      await logActivity({
        userId: req.user?.id,
        action: "CREATE",
        module: "Candidate Pipeline",
        description: `Added a note for ${candidate.name}`,
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 200,
        ipAddress: req.ip,
      });
      req.auditLogged = true;

      return res.status(200).json({
        success: true,
        message:
          "Note added successfully",
        data: candidate,
      });
    } catch (error) {
      console.error(
        "ADD NOTE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to add note",
        error: error.message,
      });
    }
  };

// =====================================================
// GET CANDIDATE INTERVIEW FEEDBACK
// GET /api/candidates/:id/interview-feedback
//
// Returns only interviews for this candidate that
// actually HAVE feedback submitted, newest-first, so
// the frontend can safely take feedbackData[0] as the
// latest feedback without picking an empty record.
// =====================================================

const getCandidateInterviewFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    const candidate = await Candidate.findById(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const interviews = await Interview.find({
      candidateId: id,
      "feedback.submittedAt": { $ne: null },
    })
      .sort({ "feedback.submittedAt": -1 })
      .populate("interviewerId", "name email")
      .lean();

    const feedbackList = interviews.map((interview) => ({
      interviewId: interview._id,
      round: interview.round,
      mode: interview.mode,
      date: interview.date,
      time: interview.time,
      interviewer: interview.interviewerId,
      overallRating: interview.feedback?.overallRating,
      recommendation: interview.feedback?.recommendation,
      technicalStrengths: interview.feedback?.technicalStrengths,
      concerns: interview.feedback?.concerns,
      submittedAt: interview.feedback?.submittedAt,
    }));

    return res.status(200).json({
      success: true,
      count: feedbackList.length,
      data: feedbackList,
    });
  } catch (error) {
    console.error(
      "GET CANDIDATE INTERVIEW FEEDBACK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch candidate interview feedback",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  applyNow,
  getAllCandidates,
  getCandidate,
  completeScreening,
  rejectCandidate,
  moveCandidateStage,
  updateInterviewStatus,
  updateOfferStatus,
  addCandidateNote,
  getCandidateInterviewFeedback,
};