
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { toast } from "sonner";

import {
  getMyInterviews,
  getMyFeedbackSubmitted,
  submitInterviewFeedback,
} from "../../lib/api/myinterviewApi";

import { getCandidate } from "../../lib/api/candidateApi";

import { useAuth } from "../../context/useAuth";

import SubmitFeedbackModal from "./SubmitFeedbackModal";
import CandidateProfile from "../../components/ui/CandidateProfile";

// =====================================================
// STATUS BADGE
// =====================================================

const getStatusBadgeClasses = (status) => {
  switch (status) {
    case "Confirmed":
    case "Scheduled":
      return "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700";

    case "Completed":
      return "rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700";

    case "Cancelled":
      return "rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700";

    case "Pending":
      return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600";

    default:
      return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600";
  }
};

// =====================================================
// STATUS LABEL
// =====================================================

const getStatusLabel = (status) => {
  if (status === "Confirmed") {
    return "Scheduled";
  }

  return status || "Unknown";
};

// =====================================================
// MODE LABEL
// =====================================================

const getModeLabel = (mode) => {
  if (!mode) return "N/A";

  switch (mode) {
    case "Video Call":
      return "Video";

    case "Video":
      return "Video";

    case "Onsite":
      return "Onsite";

    case "Phone":
      return "Phone";

    case "Phone Call":
      return "Phone";

    default:
      return mode;
  }
};

// =====================================================
// INTERVIEW DATE FORMAT
// =====================================================

const formatInterviewDate = (dateStr) => {
  if (!dateStr) {
    return "N/A";
  }

  if (
    typeof dateStr === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
  ) {
    const [year, month, day] = dateStr
      .split("-")
      .map(Number);

    const date = new Date(
      year,
      month - 1,
      day
    );

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

// =====================================================
// SUBMITTED DATE FORMAT
// =====================================================

const formatSubmittedDate = (dateStr) => {
  if (!dateStr) {
    return "N/A";
  }

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  const month = date
    .toLocaleDateString("en-US", {
      month: "short",
    })
    .toUpperCase();

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${month} ${day}`;
};

// =====================================================
// RECOMMENDATION BADGE
// =====================================================

const getRecommendationBadgeClasses = (
  recommendation
) => {
  switch (recommendation) {
    case "Strong Hire":
      return "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700";

    case "Hire":
      return "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700";

    case "No Hire":
      return "rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700";

    case "Strong No Hire":
      return "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700";

    default:
      return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600";
  }
};

// =====================================================
// MY INTERVIEWS
// =====================================================

function MyInterviews() {
  const { user } = useAuth();

  const [interviews, setInterviews] = useState([]);
  const [feedbackHistory, setFeedbackHistory] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] =
    useState(false);

  // ===================================================
  // FEEDBACK MODAL
  // ===================================================

  const [feedbackTarget, setFeedbackTarget] =
    useState(null);

  const [showFeedbackModal, setShowFeedbackModal] =
    useState(false);

  // ===================================================
  // CANDIDATE PROFILE MODAL
  // ===================================================

  const [viewCandidate, setViewCandidate] =
    useState(null);

  const [
    showCandidateProfile,
    setShowCandidateProfile,
  ] = useState(false);

  // ===================================================
  // LOAD MY INTERVIEWS + FEEDBACK
  // ===================================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setAccessDenied(false);

      const [
        interviewsResponse,
        feedbackResponse,
      ] = await Promise.all([
        getMyInterviews(),
        getMyFeedbackSubmitted(7),
      ]);

      const interviewsData =
        interviewsResponse?.data?.data || [];

      const feedbackData =
        feedbackResponse?.data?.data || [];

      setInterviews(
        Array.isArray(interviewsData)
          ? interviewsData
          : []
      );

      setFeedbackHistory(
        Array.isArray(feedbackData)
          ? feedbackData
          : []
      );
    } catch (error) {
      console.error(
        "GET MY INTERVIEWS ERROR:",
        error?.response?.data || error
      );

      if (
        error?.response?.status === 403
      ) {
        setAccessDenied(true);
        return;
      }

      toast.error(
        error?.response?.data?.message ||
          "Failed to load your interviews."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // LOAD DATA WHEN USER CHANGES
  // ===================================================

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [user, loadData]);

  // ===================================================
  // OPEN FEEDBACK MODAL
  // ===================================================

  const openFeedbackModal = (interview) => {
    setFeedbackTarget(interview);
    setShowFeedbackModal(true);
  };

  // ===================================================
  // CLOSE FEEDBACK MODAL
  // ===================================================

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackTarget(null);
  };

  // ===================================================
  // SUBMIT FEEDBACK
  // ===================================================

  const handleSubmitFeedback = async (
    interviewId,
    payload
  ) => {
    if (!interviewId) {
      toast.error(
        "Interview ID not found."
      );

      throw new Error(
        "Interview ID not found."
      );
    }

    try {
      // ================================================
      // SEND FEEDBACK TO BACKEND
      // ================================================

      await submitInterviewFeedback(
        interviewId,
        {
          overallRating: Number(
            payload.overallRating
          ),

          recommendation:
            payload.recommendation,

          technicalStrengths:
            payload.technicalStrengths || "",

          concerns:
            payload.concerns || "",
        }
      );

      // ================================================
      // NOTIFY ATS RANKING
      // ================================================

      const candidateId =
        feedbackTarget?.candidateId?._id ||
        feedbackTarget?.candidateId?.id ||
        feedbackTarget?.candidateId;

      window.dispatchEvent(
        new CustomEvent(
          "interviewFeedbackUpdated",
          {
            detail: {
              candidateId,
            },
          }
        )
      );

      // ================================================
      // UPDATE CURRENT INTERVIEW IMMEDIATELY
      // ================================================

      const updatedFeedback = {
        ...(feedbackTarget?.feedback || {}),

        overallRating: Number(
          payload.overallRating
        ),

        recommendation:
          payload.recommendation,

        technicalStrengths:
          payload.technicalStrengths || "",

        concerns:
          payload.concerns || "",

        submittedAt:
          new Date().toISOString(),
      };

      // ================================================
      // UPDATE INTERVIEWS LIST
      // ================================================

      setInterviews(
        (previousInterviews) =>
          previousInterviews.map(
            (interview) => {
              const currentId =
                interview?._id ||
                interview?.id;

              if (
                currentId !== interviewId
              ) {
                return interview;
              }

              return {
                ...interview,
                feedback:
                  updatedFeedback,
              };
            }
          )
      );

      // ================================================
      // UPDATE CURRENT FEEDBACK TARGET
      // ================================================

      setFeedbackTarget((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          feedback:
            updatedFeedback,
        };
      });

      // ================================================
      // REFRESH BACKEND DATA
      // ================================================

      await loadData();

    } catch (error) {
      console.error(
        "SUBMIT FEEDBACK ERROR:",
        error?.response?.data || error
      );

      throw error;
    }
  };

  // ===================================================
  // VIEW CANDIDATE
  // ===================================================

  const handleViewCandidate = async (
    candidate
  ) => {
    if (!candidate) {
      toast.error(
        "Candidate information not found."
      );

      return;
    }

    const candidateId =
      candidate?._id ||
      candidate?.id;

    if (!candidateId) {
      toast.error(
        "Candidate ID not found."
      );

      return;
    }

    try {
      // ================================================
      // GET FULL CANDIDATE PROFILE
      // ================================================

      const response =
        await getCandidate(
          candidateId
        );

      const candidateData =
        response?.data?.data ||
        response?.data;

      if (!candidateData) {
        toast.error(
          "Candidate information not found."
        );

        return;
      }

      // ================================================
      // OPEN PROFILE MODAL WITH API DATA
      // ================================================

      setViewCandidate(
        candidateData
      );

      setShowCandidateProfile(
        true
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

  // ===================================================
  // CLOSE CANDIDATE PROFILE
  // ===================================================

  const closeCandidateProfile = () => {
    setShowCandidateProfile(false);
    setViewCandidate(null);
  };

  // ===================================================
  // ACCESS DENIED
  // ===================================================

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            !
          </div>

          <p className="mt-4 text-base font-semibold text-slate-700">
            Access Restricted
          </p>

          <p className="mt-1 text-sm text-slate-500">
            My Interviews is only available to
            interviewers.
          </p>

        </div>
      </div>
    );
  }

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          <p className="text-sm text-slate-500">
            Loading your interviews...
          </p>

        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-8">

      {/* ============================================= */}
      {/* HEADER */}
      {/* ============================================= */}

      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          My Interviews
        </h1>

        <p className="mt-1 text-xs font-medium text-slate-500">
          Interviews assigned to you
        </p>
      </div>

      {/* ============================================= */}
      {/* INTERVIEWS */}
      {/* ============================================= */}

      {interviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

          <p className="text-base font-semibold text-slate-700">
            No interviews assigned
          </p>

          <p className="mt-1 text-sm text-slate-500">
            You currently have no interviews
            assigned to you.
          </p>

        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {interviews.map((interview) => {
            const candidate =
              interview?.candidateId;

            const status =
              interview?.status;

            const interviewId =
              interview?._id ||
              interview?.id;

            const hasFeedback =
              Boolean(
                interview?.feedback
                  ?.submittedAt
              );

            return (
              <div
                key={interviewId}
                className="flex flex-col gap-4 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >

                {/* LEFT */}

                <div className="flex items-center gap-3">

                  <div className="flex min-w-28.75 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-center">

                    <span className="text-xs font-semibold text-slate-900">
                      {interview?.time ||
                        "N/A"}
                    </span>

                    <span className="mt-1 text-xs text-slate-500">
                      {formatInterviewDate(
                        interview?.date
                      )}
                    </span>

                  </div>

                  <div>

                    <h2 className="text-base font-bold text-slate-900">
                      {candidate?.name ||
                        "Unknown Candidate"}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {candidate?.role ||
                        "No role"}

                      {(candidate?.stage ||
                        interview?.stage) && (
                        <>
                          {" · "}
                          Stage{" "}
                          {candidate?.stage ||
                            interview?.stage}
                        </>
                      )}
                    </p>

                  </div>

                </div>

                {/* RIGHT */}

                <div className="flex flex-wrap items-center gap-2">

                  {interview?.mode && (
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                      {getModeLabel(
                        interview.mode
                      )}
                    </span>
                  )}

                  <span
                    className={getStatusBadgeClasses(
                      status
                    )}
                  >
                    {getStatusLabel(
                      status
                    )}
                  </span>

                  {/* VIEW CANDIDATE */}

                  <button
                    type="button"
                    onClick={() =>
                      handleViewCandidate(
                        candidate
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View Candidate
                  </button>

                  {/* FEEDBACK */}

                  <button
                    type="button"
                    onClick={() =>
                      openFeedbackModal(
                        interview
                      )
                    }
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    {hasFeedback
                      ? "View Feedback"
                      : "Submit Feedback"}
                  </button>

                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* ============================================= */}
      {/* FEEDBACK HISTORY */}
      {/* ============================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Feedback Submitted (last 7 days)
          </h2>
        </div>

        {feedbackHistory.length === 0 ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center">

            <p className="text-sm text-slate-500">
              You haven't submitted any
              feedback in the last 7 days.
            </p>

          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">

                  <th className="py-3 pr-4">
                    Candidate
                  </th>

                  <th className="py-3 pr-4">
                    Role
                  </th>

                  <th className="py-3 pr-4">
                    Recommendation
                  </th>

                  <th className="py-3 pr-4">
                    Rating
                  </th>

                  <th className="py-3 pr-4">
                    Submitted
                  </th>

                </tr>
              </thead>

              <tbody>

                {feedbackHistory.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      No Record Found
                    </td>
                  </tr>
                )}

                {feedbackHistory.map(
                  (interview) => {
                    const candidate =
                      interview?.candidateId;

                    const feedback =
                      interview?.feedback;

                    return (
                      <tr
                        key={
                          interview?._id ||
                          interview?.id
                        }
                        className="border-b border-slate-50 last:border-b-0"
                      >

                        <td className="py-3 pr-4 font-medium text-slate-800">
                          {candidate?.name ||
                            "Unknown Candidate"}
                        </td>

                        <td className="py-3 pr-4 text-slate-600">
                          {candidate?.role ||
                            "N/A"}
                        </td>

                        <td className="py-3 pr-4">

                          <span
                            className={getRecommendationBadgeClasses(
                              feedback?.recommendation
                            )}
                          >
                            {feedback?.recommendation ||
                              "N/A"}
                          </span>

                        </td>

                        <td className="py-3 pr-4 text-slate-600">
                          {feedback?.overallRating
                            ? `${feedback.overallRating}/5`
                            : "N/A"}
                        </td>

                        <td className="py-3 pr-4 font-mono text-xs uppercase text-slate-500">
                          {formatSubmittedDate(
                            feedback?.submittedAt
                          )}
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ============================================= */}
      {/* FEEDBACK MODAL */}
      {/* ============================================= */}

      <SubmitFeedbackModal
        key={
          feedbackTarget?._id ||
          feedbackTarget?.id
        }
        isOpen={
          showFeedbackModal
        }
        interview={
          feedbackTarget
        }
        onClose={
          closeFeedbackModal
        }
        onSubmit={
          handleSubmitFeedback
        }
      />

      {/* ============================================= */}
      {/* CANDIDATE PROFILE */}
      {/* ============================================= */}

      <CandidateProfile
        isOpen={
          showCandidateProfile
        }
        candidate={
          viewCandidate
        }
        onClose={
          closeCandidateProfile
        }
        readOnly={true}
      />

    </div>
  );
}

export default MyInterviews;
