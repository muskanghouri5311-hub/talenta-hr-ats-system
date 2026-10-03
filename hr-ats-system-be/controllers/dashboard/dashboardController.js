const Candidate = require("../../models/Candidate");
const Requisition = require("../../models/Requisition");
const Offer = require("../../models/Offer");


const getDateRange = (startDate, endDate) => {
  const start = startDate
    ? new Date(`${startDate}T00:00:00`)
    : new Date();

  const end = endDate
    ? new Date(`${endDate}T23:59:59.999`)
    : new Date();

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error("Invalid date range");
  }

  if (start > end) {
    throw new Error("Start date cannot be after end date");
  }

  return {
    start,
    end,
  };
};



const getHistoricalStage = (candidate, endDate) => {
  const history = candidate.stageHistory || [];

  const validHistory = history
    .filter(
      (item) =>
        item.changedAt &&
        new Date(item.changedAt) <= endDate
    )
    .sort(
      (a, b) =>
        new Date(a.changedAt) -
        new Date(b.changedAt)
    );

  if (validHistory.length > 0) {
    return validHistory[validHistory.length - 1].stage;
  }

  if (
    candidate.createdAt &&
    new Date(candidate.createdAt) <= endDate
  ) {
    return candidate.stage;
  }

  return null;
};


const getHistoricalRequisitionStatus = (
  requisition,
  endDate
) => {
  const history = requisition.statusHistory || [];

  const validHistory = history
    .filter(
      (item) =>
        item.changedAt &&
        new Date(item.changedAt) <= endDate
    )
    .sort(
      (a, b) =>
        new Date(a.changedAt) -
        new Date(b.changedAt)
    );

  if (validHistory.length > 0) {
    return validHistory[validHistory.length - 1].status;
  }

  if (
    requisition.createdAt &&
    new Date(requisition.createdAt) <= endDate
  ) {
    return requisition.status;
  }

  return null;
};


const getDashboard = async (req, res) => {
  try {
    

    const { start, end } = getDateRange(
      req.query.startDate,
      req.query.endDate
    );

    const [candidates, requisitions, offers] =
      await Promise.all([
        Candidate.find()
          .select(
            "name role stage stageHistory createdAt score offer"
          )
          .sort({ createdAt: -1 }),

        Requisition.find()
          .select(
            "role department openings status statusHistory createdAt deadline"
          )
          .sort({ createdAt: -1 }),

        Offer.find()
          .select(
            "candidateId status sentAt acceptedAt rejectedAt createdAt"
          )
          .sort({ sentAt: -1 }),
      ]);


    const openRoles = requisitions.filter((requisition) => {
      const status = getHistoricalRequisitionStatus(
        requisition,
        end
      );

      return status === "Open";
    });

    const candidatesAtEndDate = candidates.filter(
      (candidate) => {
        if (!candidate.createdAt) {
          return false;
        }

        return new Date(candidate.createdAt) <= end;
      }
    );


    const historicalCandidates = candidatesAtEndDate.map(
      (candidate) => ({
        candidate,
        stage: getHistoricalStage(candidate, end),
      })
    );

    const activeCandidates =
      historicalCandidates.filter(
        ({ stage }) =>
          stage &&
          stage !== "Hired" &&
          stage !== "Rejected"
      ).length;

    
    const funnelStages = [
      "Applied",
      "Screening",
      "Shortlisted",
      "Interview",
      "Offer Sent",
      "Hired",
    ];

    const funnel = {};

    funnelStages.forEach((stage) => {
      funnel[stage] =
        historicalCandidates.filter(
          (item) => item.stage === stage
        ).length;
    });

    const offersInRange = offers.filter((offer) => {
      const sentDate =
        offer.sentAt || offer.createdAt;

      if (!sentDate) {
        return false;
      }

      const date = new Date(sentDate);

      return date >= start && date <= end;
    });

    
    const acceptedOffers =
      offersInRange.filter((offer) => {
        if (
          offer.status !== "Accepted" ||
          !offer.acceptedAt
        ) {
          return false;
        }

        const acceptedDate = new Date(
          offer.acceptedAt
        );

        return acceptedDate <= end;
      }).length;


    const offerAcceptance =
      offersInRange.length > 0
        ? Math.round(
            (acceptedOffers /
              offersInRange.length) *
              100
          )
        : 0;


    const hiredCandidates = candidates.filter(
      (candidate) => {
        if (
          !candidate.createdAt ||
          !candidate.offer?.acceptedAt
        ) {
          return false;
        }

        const hiredDate = new Date(
          candidate.offer.acceptedAt
        );

        return (
          hiredDate >= start &&
          hiredDate <= end
        );
      }
    );

    let avgTimeToHire = 0;

    if (hiredCandidates.length > 0) {
      const totalDays =
        hiredCandidates.reduce(
          (total, candidate) => {
            const applicationDate = new Date(
              candidate.createdAt
            );

            const hiredDate = new Date(
              candidate.offer.acceptedAt
            );

            const difference =
              hiredDate - applicationDate;

            const days =
              difference /
              (1000 * 60 * 60 * 24);

            return total + Math.max(0, days);
          },
          0
        );

      avgTimeToHire = Math.round(
        totalDays / hiredCandidates.length
      );
    }


    const recentApplications = candidates
      .filter((candidate) => {
        if (!candidate.createdAt) {
          return false;
        }

        const createdDate = new Date(
          candidate.createdAt
        );

        return (
          createdDate >= start &&
          createdDate <= end
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )
      .slice(0, 4)
      .map((candidate) => ({
        id: candidate._id,
        name: candidate.name,
        role: candidate.role,
        stage: getHistoricalStage(
          candidate,
          end
        ),
        score: candidate.score,
        createdAt: candidate.createdAt,
      }));

 

    return res.status(200).json({
      success: true,

      data: {
        startDate: start
          .toISOString()
          .split("T")[0],

        endDate: end
          .toISOString()
          .split("T")[0],

        stats: {
          openRoles: openRoles.length,
          activeCandidates,
          offerAcceptance,
          avgTimeToHire,
        },

        funnel: {
          applied: funnel.Applied,
          screening: funnel.Screening,
          shortlisted: funnel.Shortlisted,
          interview: funnel.Interview,
          offer: funnel["Offer Sent"],
          hired: funnel.Hired,
        },

        recentApplications,
      },
    });
  } catch (error) {
    console.error(
      "DASHBOARD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load dashboard",
    });
  }
};

module.exports = {
  getDashboard,
};