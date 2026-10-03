const Offer = require("../../models/Offer");
const Candidate = require("../../models/Candidate");
const logActivity = require("../../services/audit/auditService");
const sendEmail = require("../../config/sendEmail");
const {
  generateOfferLetterPdfBuffer,
} = require("../../services/offer/offerLetterService");

const sendOffer = async (req, res) => {
  try {
    const {
      candidateId,
      template,
      joiningDate,
      salary,
      probation,
      workingType,
      acknowledgeByDate,
      note,
    } = req.body;

    if (
      !candidateId ||
      !template ||
      !joiningDate ||
      salary === undefined ||
      salary === null ||
      !probation ||
      !workingType ||
      !acknowledgeByDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required offer fields.",
      });
    }

    const joiningDateObject = new Date(joiningDate);

    if (Number.isNaN(joiningDateObject.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid joining date.",
      });
    }

    const acknowledgeByDateObject = new Date(acknowledgeByDate);

    if (Number.isNaN(acknowledgeByDateObject.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid acknowledge by date.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    joiningDateObject.setHours(0, 0, 0, 0);

    if (joiningDateObject < today) {
      return res.status(400).json({
        success: false,
        message: "Joining date cannot be a previous date.",
      });
    }

    if (acknowledgeByDateObject > joiningDateObject) {
      return res.status(400).json({
        success: false,
        message:
          "Acknowledge by date should be on or before the joining date.",
      });
    }

    // -----------------------------------------
    // FIND CANDIDATE + POPULATE JOB (for department)
    // -----------------------------------------

    const candidate = await Candidate.findById(candidateId).populate(
      "requisitionId",
      "department"
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    if (candidate.stage === "Hired") {
      return res.status(400).json({
        success: false,
        message: "Cannot send an offer to a hired candidate.",
      });
    }

    if (candidate.stage === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot send an offer to a rejected candidate.",
      });
    }

    if (
      candidate.stage === "Offer Sent" ||
      candidate.offer?.status === "Sent"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Offer letter has already been sent to this candidate.",
      });
    }

    const existingOffer = await Offer.findOne({
      candidateId,
      status: "Sent",
    });

    if (existingOffer) {
      return res.status(400).json({
        success: false,
        message:
          "Offer letter has already been sent to this candidate.",
      });
    }

    const sentAt = new Date();

    const offer = await Offer.create({
      candidateId,
      template,
      joiningDate,
      salary: Number(salary),
      probation,
      workingType,
      acknowledgeByDate,
      note: note || "",
      status: "Sent",
      sentAt,
    });

    candidate.stage = "Offer Sent";

    candidate.offer = {
      ...(candidate.offer?.toObject
        ? candidate.offer.toObject()
        : candidate.offer),
      position: candidate.role,
      status: "Sent",
      salary: String(salary),
      joiningDate,
      employmentType: template,
      notes: note || "",
      sentAt,
    };

    await candidate.save();

    // -----------------------------------------
    // GENERATE OFFER LETTER PDF + SEND EMAIL
    // -----------------------------------------

    let emailWarning = null;

    try {
      console.log("GENERATING OFFER LETTER PDF FOR:", candidate.email);

      const offerLetterPdfBuffer = await generateOfferLetterPdfBuffer({
        offerDate: sentAt,
        candidateName: candidate.name,
        jobTitle: candidate.role,
        department:
          candidate.requisitionId?.department || "—",
        employmentType: template,
        startDate: joiningDate,
        workingType,
        acknowledgeByDate,
      });

      console.log("PDF GENERATED, SIZE:", offerLetterPdfBuffer.length);

      const emailMessage = `Dear ${candidate.name},

We are pleased to share your official offer letter for the position of ${candidate.role} at Compilex Technologies. Please find the offer letter attached to this email.

${note ? `Note from HR: ${note}\n\n` : ""}Please review the attached document and acknowledge your acceptance by ${new Date(
        acknowledgeByDate
      ).toDateString()}.

Warm regards,
Human Resources Department
Compilex Technologies`;

      await sendEmail({
        email: candidate.email,
        subject: `Employment Offer Letter — ${candidate.role}`,
        message: emailMessage,
        attachments: [
          {
            filename: `Offer_Letter_${candidate.name.replace(
              /\s+/g,
              "_"
            )}.pdf`,
            content: offerLetterPdfBuffer,
          },
        ],
      });

      console.log("OFFER LETTER EMAIL SENT TO:", candidate.email);
    } catch (emailError) {
      console.error("OFFER LETTER EMAIL ERROR:", emailError);
      emailWarning =
        "Offer was created but the email could not be sent. Please resend manually.";
    }

    await logActivity({
      userId: req.user?.id,
      action: "SEND",
      module: "Offer Letters",
      description: `Sent offer to ${candidate.name}`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 201,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    return res.status(201).json({
      success: true,
      message: emailWarning
        ? "Offer created, but email failed to send."
        : "Offer sent successfully.",
      warning: emailWarning,
      data: {
        offer,
        candidate,
      },
    });
  } catch (error) {
    console.error("SEND OFFER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send offer.",
    });
  }
};

const getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate({
        path: "candidateId",
        select: "name email role",
      })
      .sort({
        sentAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (error) {
    console.error("GET ALL OFFERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get offer letters.",
    });
  }
};

const getCandidateOffer = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const offer = await Offer.findOne({
      candidateId,
    })
      .populate({
        path: "candidateId",
        select: "name email role",
      })
      .sort({
        createdAt: -1,
      });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error(
      "GET CANDIDATE OFFER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get offer.",
    });
  }
};
const updateOfferStatus = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { status } = req.body;

    const validStatuses = ["Accepted", "Rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer status.",
      });
    }

    const offer = await Offer.findOne({ candidateId }).sort({ createdAt: -1 });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
    }

    if (offer.status !== "Sent") {
      return res.status(400).json({
        success: false,
        message: "Only a sent offer can be accepted or rejected.",
      });
    }

    const statusDate = new Date();

    offer.status = status;

    if (status === "Accepted") {
      offer.acceptedAt = statusDate;
    }

    if (status === "Rejected") {
      offer.rejectedAt = statusDate;
    }

    await offer.save();

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    if (status === "Accepted") {
      candidate.stage = "Hired";

      // Reports & Analytics ke liye zaroori — warna recruiter
      // performance report mein ye candidate kabhi show nahi hoga.
      if (!candidate.recruiterId && req.user?._id) {
        candidate.recruiterId = req.user._id;
      }

      candidate.offer = {
        ...(candidate.offer?.toObject
          ? candidate.offer.toObject()
          : candidate.offer),
        status: "Accepted",
        acceptedAt: statusDate,
      };
    }

    if (status === "Rejected") {
      candidate.stage = "Rejected";

      candidate.offer = {
        ...(candidate.offer?.toObject
          ? candidate.offer.toObject()
          : candidate.offer),
        status: "Rejected",
        rejectedAt: statusDate,
      };
    }

    await candidate.save(); // hiredAt yahan Candidate model ka pre-save hook khud set kar dega

    return res.status(200).json({
      success: true,
      message: `Offer ${status.toLowerCase()}.`,
      data: {
        offer,
        candidate,
      },
    });
  } catch (error) {
    console.error("UPDATE OFFER STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update offer status.",
    });
  }
};

module.exports = {
  sendOffer,
  getAllOffers,
  getCandidateOffer,
  updateOfferStatus,
};