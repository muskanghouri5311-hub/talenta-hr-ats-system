import { useEffect, useState } from "react";
import { toast } from "sonner";

import CandidateCard from "../../components/ui/CandidateCard";
import OfferLetterModal from "./OfferLetter";
import CandidateProfile from "../../components/ui/CandidateProfile";
import ScheduleInterviewModal from "../../components/ui/ScheduleInterviewModal";

import { getATSRanking } from "../../lib/api/atsApi";

import {
  fetchAllCandidates,
  getCandidate,
  scheduleInterview,
  moveCandidateStage,
  sendOffer,
} from "../../lib/api/candidateApi";

import { getRequisitions } from "../../lib/api/requisitionApi";

function ATSRanking() {
  const [candidates, setCandidates] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [selectedRequisition, setSelectedRequisition] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [offerCandidate, setOfferCandidate] = useState(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleCandidate, setScheduleCandidate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [requisitionLoading, setRequisitionLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // CHECK INTERVIEW PASSED
  // ==========================================
  const isInterviewPassed = (candidate) => {
    if (!candidate) return false;

    const possibleValues = [
      candidate?.interviewStatus,
      candidate?.interviewResult,
      candidate?.interviewOutcome,
      candidate?.feedbackStatus,
      candidate?.feedbackResult,

      candidate?.interview?.status,
      candidate?.interview?.result,
      candidate?.interview?.outcome,

      candidate?.feedback?.status,
      candidate?.feedback?.result,
      candidate?.feedback?.outcome,
      candidate?.feedback?.recommendation,
      candidate?.feedback?.decision,

      candidate?.interviewFeedback?.status,
      candidate?.interviewFeedback?.result,
      candidate?.interviewFeedback?.outcome,
      candidate?.interviewFeedback?.recommendation,
      candidate?.interviewFeedback?.decision,
    ];

    return possibleValues.some((value) => {
      if (typeof value === "boolean") {
        return value === true;
      }

      if (typeof value !== "string") {
        return false;
      }

      const normalizedValue = value.trim().toLowerCase();

      return (
        normalizedValue === "passed" ||
        normalizedValue === "pass" ||
        normalizedValue === "hire" ||
        normalizedValue === "strong hire"
      );
    });
  };

  // ==========================================
  // GET LATEST INTERVIEW STATUS
  // ==========================================
  const enrichCandidatesWithInterviewStatus = async (
    candidateList
  ) => {
    if (!Array.isArray(candidateList) || !candidateList.length) {
      return [];
    }

    const enrichedCandidates = await Promise.all(
      candidateList.map(async (candidate) => {
        const candidateId =
          candidate?.candidateId ||
          candidate?._id ||
          candidate?.id;

        if (!candidateId) {
          return {
            ...candidate,
            interviewPassed: false,
          };
        }

        try {
          const response = await getCandidate(candidateId);

          const latestCandidate =
            response?.data?.data || response?.data;

          if (!latestCandidate) {
            return {
              ...candidate,
              interviewPassed: isInterviewPassed(candidate),
            };
          }

          return {
            ...candidate,
            ...latestCandidate,
            interviewPassed:
              isInterviewPassed(latestCandidate),
          };
        } catch (error) {
          console.error(
            `GET LATEST CANDIDATE ERROR (${candidateId}):`,
            error?.response?.data || error
          );

          return {
            ...candidate,
            interviewPassed: isInterviewPassed(candidate),
          };
        }
      })
    );

    return enrichedCandidates;
  };

  // ==========================================
  // REFRESH ATS CANDIDATES
  // ==========================================
  const refreshATSCandidates = async () => {
    try {
      const response = await getATSRanking(
        selectedRequisition || undefined
      );

      if (response?.success) {
        const atsCandidates = response.data || [];

        const enrichedCandidates =
          await enrichCandidatesWithInterviewStatus(
            atsCandidates
          );

        setCandidates(enrichedCandidates);
        return;
      }

      // Fallback
      const fallbackResponse =
        await fetchAllCandidates();

      const data =
        fallbackResponse?.data?.data || [];

      let filteredData = data;

      if (selectedRequisition) {
        filteredData = data.filter((candidate) => {
          const candidateRequisitionId =
            candidate?.requisitionId?._id ||
            candidate?.requisitionId ||
            candidate?.jobId?._id ||
            candidate?.jobId;

          return (
            String(candidateRequisitionId) ===
            String(selectedRequisition)
          );
        });
      }

      const enrichedCandidates =
        await enrichCandidatesWithInterviewStatus(
          filteredData
        );

      setCandidates(enrichedCandidates);
    } catch (error) {
      console.error(
        "REFRESH ATS CANDIDATES ERROR:",
        error?.response?.data || error
      );
    }
  };

  // ==========================================
  // REFRESH ONE CANDIDATE INTERVIEW STATUS
  // ==========================================
  const refreshCandidateInterviewStatus = async (
    candidateId
  ) => {
    if (!candidateId) return;

    try {
      const response =
        await getCandidate(candidateId);

      const latestCandidate =
        response?.data?.data ||
        response?.data;

      if (!latestCandidate) return;

      const interviewPassed =
        isInterviewPassed(latestCandidate);

      setCandidates((prev) =>
        prev.map((item) => {
          const itemId =
            item?.candidateId ||
            item?._id ||
            item?.id;

          if (
            String(itemId) ===
            String(candidateId)
          ) {
            return {
              ...item,
              ...latestCandidate,
              interviewPassed,
            };
          }

          return item;
        })
      );
    } catch (error) {
      console.error(
        "REFRESH CANDIDATE INTERVIEW STATUS ERROR:",
        error?.response?.data || error
      );
    }
  };

  // ==========================================
  // GET REQUISITIONS
  // ==========================================
  useEffect(() => {
    const fetchRequisitionList = async () => {
      try {
        setRequisitionLoading(true);

        const response =
          await getRequisitions();

        const data =
          response?.data?.data ||
          response?.data ||
          [];

        setRequisitions(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "GET REQUISITIONS ERROR:",
          error?.response?.data || error
        );

        setRequisitions([]);

        toast.error(
          error?.response?.data?.message ||
            "Failed to load jobs."
        );
      } finally {
        setRequisitionLoading(false);
      }
    };

    fetchRequisitionList();
  }, []);

  // ==========================================
  // GET ATS CANDIDATES
  // ==========================================
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getATSRanking(
            selectedRequisition || undefined
          );

        if (response?.success) {
          const atsCandidates =
            response.data || [];

          const enrichedCandidates =
            await enrichCandidatesWithInterviewStatus(
              atsCandidates
            );

          setCandidates(enrichedCandidates);
        } else {
          const fallbackResponse =
            await fetchAllCandidates();

          const data =
            fallbackResponse?.data?.data || [];

          let filteredData = data;

          if (selectedRequisition) {
            filteredData = data.filter(
              (candidate) => {
                const candidateRequisitionId =
                  candidate?.requisitionId?._id ||
                  candidate?.requisitionId ||
                  candidate?.jobId?._id ||
                  candidate?.jobId;

                return (
                  String(
                    candidateRequisitionId
                  ) ===
                  String(selectedRequisition)
                );
              }
            );
          }

          const enrichedCandidates =
            await enrichCandidatesWithInterviewStatus(
              filteredData
            );

          setCandidates(enrichedCandidates);

          if (!enrichedCandidates.length) {
            const message =
              response?.message ||
              "No candidates found.";

            setError(message);
          }
        }
      } catch (error) {
        console.error(
          "ATS CANDIDATES ERROR:",
          error?.response?.data || error
        );

        try {
          const fallbackResponse =
            await fetchAllCandidates();

          const data =
            fallbackResponse?.data?.data || [];

          let filteredData = data;

          if (selectedRequisition) {
            filteredData = data.filter(
              (candidate) => {
                const candidateRequisitionId =
                  candidate?.requisitionId?._id ||
                  candidate?.requisitionId ||
                  candidate?.jobId?._id ||
                  candidate?.jobId;

                return (
                  String(
                    candidateRequisitionId
                  ) ===
                  String(selectedRequisition)
                );
              }
            );
          }

          const enrichedCandidates =
            await enrichCandidatesWithInterviewStatus(
              filteredData
            );

          setCandidates(enrichedCandidates);

          if (!enrichedCandidates.length) {
            const message =
              error?.response?.data?.message ||
              "No candidates found.";

            setError(message);
          }
        } catch (fallbackError) {
          console.error(
            "GET CANDIDATES ERROR:",
            fallbackError?.response?.data ||
              fallbackError
          );

          setCandidates([]);

          const message =
            error?.response?.data?.message ||
            "Failed to load candidates";

          setError(message);

          toast.error(message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [selectedRequisition]);

  // ==========================================
  // AUTO REFRESH WHEN ATS PAGE GETS FOCUS
  // ==========================================
  useEffect(() => {
    const handleWindowFocus = async () => {
      await refreshATSCandidates();
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await refreshATSCandidates();
      }
    };

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleWindowFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [selectedRequisition]);

  // ==========================================
  // INTERVIEW FEEDBACK EVENT
  // ==========================================
  useEffect(() => {
    const handleInterviewFeedbackUpdated = async (
      event
    ) => {
      const candidateId =
        event?.detail?.candidateId;

      if (!candidateId) {
        await refreshATSCandidates();
        return;
      }

      await refreshCandidateInterviewStatus(
        candidateId
      );
    };

    window.addEventListener(
      "interviewFeedbackUpdated",
      handleInterviewFeedbackUpdated
    );

    return () => {
      window.removeEventListener(
        "interviewFeedbackUpdated",
        handleInterviewFeedbackUpdated
      );
    };
  }, [selectedRequisition]);

  const handleRequisitionChange = (
    event
  ) => {
    setSelectedRequisition(
      event.target.value
    );
  };

  // ==========================================
  // VIEW CANDIDATE
  // ==========================================
  const handleViewCandidate = async (
    candidate
  ) => {
    const candidateId =
      candidate?.candidateId ||
      candidate?._id;

    if (!candidateId) {
      toast.error(
        "Candidate ID not found."
      );
      return;
    }

    try {
      const response =
        await getCandidate(candidateId);

      const fullCandidate =
        response?.data?.data;

      if (!fullCandidate) {
        throw new Error(
          "Candidate data not found."
        );
      }

      setSelectedCandidate(
        fullCandidate
      );
    } catch (error) {
      console.error(
        "GET CANDIDATE ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to load candidate profile."
      );
    }
  };

  // ==========================================
  // REJECT CANDIDATE
  // ==========================================
  const handleRejectCandidate = (
    updatedCandidate
  ) => {
    try {
      const candidateId =
        updatedCandidate?.candidateId ||
        updatedCandidate?._id ||
        updatedCandidate?.id;

      if (!candidateId) {
        toast.error(
          "Candidate ID not found."
        );
        return;
      }

      setCandidates((prev) =>
        prev.map((item) => {
          const itemId =
            item?.candidateId ||
            item?._id ||
            item?.id;

          if (
            String(itemId) ===
            String(candidateId)
          ) {
            return {
              ...item,
              stage: "Rejected",
              status: "Rejected",
              interviewPassed: false,
            };
          }

          return item;
        })
      );

      setSelectedCandidate((prev) => {
        if (!prev) {
          return prev;
        }

        const prevId =
          prev?.candidateId ||
          prev?._id ||
          prev?.id;

        if (
          String(prevId) ===
          String(candidateId)
        ) {
          return {
            ...prev,
            stage: "Rejected",
            status: "Rejected",
          };
        }

        return prev;
      });

      setOfferCandidate(null);
      setOpenModal(false);
      setScheduleModalOpen(false);
      setScheduleCandidate(null);

      toast.success(
        "Candidate rejected successfully."
      );
    } catch (error) {
      console.error(
        "REJECT CANDIDATE ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to update candidate."
      );
    }
  };

  // ==========================================
  // SCHEDULE INTERVIEW
  // ==========================================
  const handleScheduleInterview = (
    candidate
  ) => {
    if (!candidate) {
      toast.error(
        "Candidate not found."
      );
      return;
    }

    const candidateId =
      candidate?.candidateId ||
      candidate?._id;

    if (!candidateId) {
      toast.error(
        "Candidate ID not found."
      );
      return;
    }

    if (
      candidate?.stage ===
      "Rejected"
    ) {
      toast.error(
        "Rejected candidate cannot be scheduled for an interview."
      );

      return;
    }

    if (
      candidate?.stage === "Interview" ||
      candidate?.stage === "Offer Sent" ||
      candidate?.stage === "Hired"
    ) {
      toast.error(
        "Interview has already been scheduled for this candidate."
      );

      return;
    }

    setScheduleCandidate({
      ...candidate,
      _id: candidateId,
      candidateId,
    });

    setSelectedCandidate(null);
    setScheduleModalOpen(true);
  };

  // ==========================================
  // SUBMIT INTERVIEW
  // ==========================================
  const handleSubmitInterview = async (
    candidate,
    interviewData
  ) => {
    try {
      const candidateId =
        candidate?.candidateId ||
        candidate?._id;

      if (!candidateId) {
        toast.error(
          "Candidate ID not found."
        );
        return;
      }

      if (!interviewData) {
        toast.error(
          "Interview details not found."
        );
        return;
      }

      if (!interviewData.round) {
        toast.error(
          "Interview round is required."
        );
        return;
      }

      if (!interviewData.mode) {
        toast.error(
          "Interview mode is required."
        );
        return;
      }

      if (!interviewData.date) {
        toast.error(
          "Interview date is required."
        );
        return;
      }

      if (!interviewData.time) {
        toast.error(
          "Interview time is required."
        );
        return;
      }

      if (!interviewData.duration) {
        toast.error(
          "Interview duration is required."
        );
        return;
      }

      if (!interviewData.interviewerId) {
        toast.error(
          "Please select interviewer."
        );
        return;
      }

      const payload = {
        candidateId,
        round: interviewData.round,
        mode: interviewData.mode,
        date: interviewData.date,
        time: interviewData.time,
        duration: interviewData.duration,
        interviewerId:
          interviewData.interviewerId,
        location:
          interviewData.location || "",
        notes:
          interviewData.notes || "",
      };

      await scheduleInterview(
        payload
      );

      await moveCandidateStage(
        candidateId,
        "Interview"
      );

      setCandidates((prev) =>
        prev.map((item) => {
          const itemId =
            item?.candidateId ||
            item?._id;

          if (
            String(itemId) ===
            String(candidateId)
          ) {
            return {
              ...item,
              stage: "Interview",
              interviewPassed: false,
            };
          }

          return item;
        })
      );

      setScheduleModalOpen(false);
      setScheduleCandidate(null);
      setSelectedCandidate(null);

      toast.success(
        "Interview scheduled successfully."
      );
    } catch (error) {
      console.error(
        "SCHEDULE INTERVIEW ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to schedule interview."
      );
    }
  };

  // ==========================================
  // OPEN OFFER
  // ==========================================
  const handleOpenOffer = async (
    candidate
  ) => {
    if (!candidate) {
      toast.error(
        "Candidate not found."
      );
      return;
    }

    const candidateId =
      candidate?.candidateId ||
      candidate?._id;

    if (!candidateId) {
      toast.error(
        "Candidate ID not found."
      );
      return;
    }

    const offerAlreadySent =
      candidate?.stage === "Offer Sent" ||
      candidate?.offer?.status === "Sent";

    if (offerAlreadySent) {
      toast.error(
        "Offer letter has already been sent to this candidate."
      );

      return;
    }

    try {
      const response =
        await getCandidate(
          candidateId
        );

      const latestCandidate =
        response?.data?.data ||
        response?.data;

      if (!latestCandidate) {
        toast.error(
          "Unable to get latest candidate information."
        );

        return;
      }

      const interviewPassed =
        isInterviewPassed(
          latestCandidate
        );

      if (!interviewPassed) {
        toast.error(
          "Candidate must pass the interview before moving to offer."
        );

        return;
      }

      // Update local state immediately
      setCandidates((prev) =>
        prev.map((item) => {
          const itemId =
            item?.candidateId ||
            item?._id ||
            item?.id;

          if (
            String(itemId) ===
            String(candidateId)
          ) {
            return {
              ...item,
              ...latestCandidate,
              interviewPassed: true,
            };
          }

          return item;
        })
      );

      setSelectedCandidate(null);

      setOfferCandidate({
        ...latestCandidate,
        _id:
          latestCandidate?._id ||
          candidateId,
        candidateId:
          latestCandidate?.candidateId ||
          candidateId,
        interviewPassed: true,
      });

      setOpenModal(true);
    } catch (error) {
      console.error(
        "CHECK INTERVIEW STATUS ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to check interview status."
      );
    }
  };

  // ==========================================
  // SEND OFFER
  // ==========================================
  const handleSendOffer = async (
    candidate,
    offerData
  ) => {
    try {
      if (!candidate) {
        toast.error(
          "Candidate not selected."
        );

        return;
      }

      const candidateId =
        candidate?.candidateId ||
        candidate?._id;

      if (!candidateId) {
        toast.error(
          "Candidate ID not found."
        );

        return;
      }

      if (!offerData) {
        toast.error(
          "Offer details not found."
        );

        return;
      }

      const candidateResponse =
        await getCandidate(
          candidateId
        );

      const latestCandidate =
        candidateResponse?.data?.data ||
        candidateResponse?.data;

      if (!latestCandidate) {
        toast.error(
          "Unable to get latest candidate information."
        );

        return;
      }

      const offerAlreadySent =
        latestCandidate?.stage ===
          "Offer Sent" ||
        latestCandidate?.offer?.status ===
          "Sent";

      if (offerAlreadySent) {
        toast.error(
          "Offer letter has already been sent to this candidate."
        );

        return;
      }

      const interviewPassed =
        isInterviewPassed(
          latestCandidate
        );

      if (!interviewPassed) {
        toast.error(
          "Candidate must pass the interview before sending an offer."
        );

        return;
      }

      const response =
        await sendOffer(
          candidateId,
          offerData
        );

      await moveCandidateStage(
        candidateId,
        "Offer Sent"
      );

      setCandidates((prev) =>
        prev.map((item) => {
          const itemId =
            item?.candidateId ||
            item?._id;

          if (
            String(itemId) ===
            String(candidateId)
          ) {
            return {
              ...item,
              stage: "Offer Sent",
              interviewPassed: true,
              offer: {
                ...(item.offer || {}),
                ...offerData,
                status: "Sent",
              },
            };
          }

          return item;
        })
      );

      setOpenModal(false);
      setOfferCandidate(null);
      setSelectedCandidate(null);

      toast.success(
        response?.data?.message ||
          "Offer sent successfully."
      );
    } catch (error) {
      console.error(
        "SEND OFFER ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to send offer."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-6 py-7 sm:px-8">

      <div className="mb-5 flex items-start justify-between gap-5 text-left">
        <div>
          <h1 className="text-[22px] font-medium leading-tight text-slate-900">
            ATS Ranking
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Candidates ranked based on CV ATS-friendliness
          </p>
        </div>

        <select
          value={selectedRequisition}
          onChange={handleRequisitionChange}
          disabled={requisitionLoading}
          className="w-50 rounded-lg font-bold border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="">
            {requisitionLoading
              ? "Loading jobs..."
              : "Show All"}
          </option>

          {requisitions.map(
            (requisition) => {
              const requisitionId =
                requisition?._id ||
                requisition?.id;

              const requisitionTitle =
                requisition?.title ||
                requisition?.jobTitle ||
                requisition?.position ||
                requisition?.role ||
                "Untitled Job";

              return (
                <option
                  key={requisitionId}
                  value={requisitionId}
                >
                  {requisitionTitle}
                </option>
              );
            }
          )}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

        {loading && (
          <div className="px-6 py-8 text-center text-sm text-slate-500">
            Calculating ATS scores...
          </div>
        )}

        {!loading && error && (
          <div className="px-6 py-8 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          candidates.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              No candidates found.
            </div>
          )}

        {!loading &&
          !error &&
          candidates.length > 0 &&
          candidates.map(
            (candidate, index) => {
              const offerAlreadySent =
                candidate?.stage ===
                  "Offer Sent" ||
                candidate?.offer?.status ===
                  "Sent";

              const interviewPassed =
                candidate?.interviewPassed ===
                true;

              const candidateExperience =
                candidate?.candidateExperience ??
                candidate?.experience ??
                0;

              return (
                <CandidateCard
                  key={
                    candidate?.candidateId ||
                    candidate?._id ||
                    index
                  }

                  showViewCandidate={false}

                  candidate={{
                    id:
                      candidate?.candidateId ||
                      candidate?._id,

                    rank: String(
                      candidate?.rank ||
                        index + 1
                    ).padStart(2, "0"),

                    score:
                      candidate?.score || 0,

                    color:
                      candidate?.score >=
                      75
                        ? "green"
                        : candidate?.score >=
                          50
                        ? "yellow"
                        : "red",

                    name:
                      candidate?.name,

                    experience:
                      candidateExperience
                        ? `${candidateExperience} years experience`
                        : "Experience information not detected",

                    role:
                      candidate?.role ||
                      "",

                    skills:
                      candidate?.detectedSkills ||
                      candidate?.matchedSkills ||
                      [],

                    stage:
                      candidate?.stage,

                    offer:
                      candidate?.offer,

                    offerAlreadySent,

                    // IMPORTANT
                    // Controls Move to Offer
                    interviewPassed,
                  }}

                  onViewResume={() => {
                    setOfferCandidate(null);
                    setOpenModal(false);

                    handleViewCandidate(
                      candidate
                    );
                  }}

                  onMoveOffer={() => {
                    handleOpenOffer(
                      candidate
                    );
                  }}

                  onReject={() => {
                    handleRejectCandidate(
                      candidate
                    );
                  }}
                />
              );
            }
          )}
      </div>

      <OfferLetterModal
        isOpen={openModal}
        candidate={offerCandidate}
        onClose={() => {
          setOpenModal(false);
          setOfferCandidate(null);
        }}
        onSendOffer={
          handleSendOffer
        }
      />

      <CandidateProfile
        isOpen={
          !!selectedCandidate
        }
        onClose={() => {
          setSelectedCandidate(
            null
          );
        }}
        candidate={
          selectedCandidate
        }
        onScheduleInterview={
          handleScheduleInterview
        }
        onReject={
          handleRejectCandidate
        }
        onOpenOfferModal={
          handleOpenOffer
        }
      />

      <ScheduleInterviewModal
        isOpen={
          scheduleModalOpen
        }
        candidate={
          scheduleCandidate
        }
        onClose={() => {
          setScheduleModalOpen(false);
          setScheduleCandidate(null);
        }}
        onSubmit={
          handleSubmitInterview
        }
      />
    </div>
  );
}

export default ATSRanking;