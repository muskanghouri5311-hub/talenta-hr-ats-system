import {
  useEffect,
  useState,
} from "react";

import { toast } from "sonner";

import ScoreCircle from "./ScoreCircle";
import {
  rejectCandidate,
  updateOfferStatus,
  completeScreening,
  passInterview,
  getCandidateInterviewFeedback,
} from "../../lib/api/candidateApi";

const PIPELINE_STAGES = [
  "Applied",
  "Screening",
  "Shortlisted",
  "Interview",
  "Offer Sent",
  "Hired",
];

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

function CandidateProfile({
  isOpen,
  candidate,
  onClose,
  onScheduleInterview,
  onReject,
  onRefresh,
  onAcceptOffer,
  onOpenOfferModal,
  readOnly = false,
}) {
  const [rejecting, setRejecting] =
    useState(false);

  const [downloading, setDownloading] =
    useState(false);

  const [decisionLoading, setDecisionLoading] =
    useState(false);

  // =====================================================
  // CANDIDATE FEEDBACK STATE
  // =====================================================

  const [candidateFeedback, setCandidateFeedback] =
    useState(null);

  const [feedbackLoading, setFeedbackLoading] =
    useState(false);

  // =====================================================
  // CANDIDATE ID
  // =====================================================

  const candidateId =
    candidate?._id ||
    candidate?.id ||
    candidate?.candidateId;

  // =====================================================
  // LOAD CANDIDATE FEEDBACK
  // =====================================================
useEffect(() => {
  let mounted = true;

  const loadCandidateFeedback = async () => {
    if (!isOpen || !candidateId) {
      return;
    }

    try {
      setFeedbackLoading(true);
      setCandidateFeedback(null);

      const response =
        await getCandidateInterviewFeedback(
          candidateId
        );

      if (!mounted) {
        return;
      }

      const feedbackData =
        response?.data?.data;

      if (
        Array.isArray(feedbackData) &&
        feedbackData.length > 0
      ) {
        setCandidateFeedback(
          feedbackData[0]
        );
      } else {
        setCandidateFeedback(null);
      }
    } catch (error) {
      console.error(
        "GET CANDIDATE FEEDBACK ERROR:",
        error?.response?.data || error
      );

      if (mounted) {
        setCandidateFeedback(null);
      }
    } finally {
      if (mounted) {
        setFeedbackLoading(false);
      }
    }
  };

  loadCandidateFeedback();

  return () => {
    mounted = false;
  };
}, [isOpen, candidateId]);

  // =====================================================
  // HIDE MODAL
  // =====================================================

  if (!isOpen || !candidate) {
    return null;
  }

  // =====================================================
  // REJECTED
  // =====================================================

  const isRejected =
    candidate.stage === "Rejected";

  const isHired =
    candidate.stage === "Hired";

  // =====================================================
  // INTERVIEW STATUS
  // =====================================================

  const interviewStatus =
    candidate?.interviewStatus;

  const interviewPassed =
    interviewStatus === "Passed";

  const interviewScheduled =
    interviewStatus === "Scheduled";

  const interviewCompleted =
    interviewStatus === "Completed" ||
    interviewPassed;

  // =====================================================
  // PIPELINE PROGRESS
  // =====================================================

  const currentStageIndex =
    PIPELINE_STAGES.indexOf(
      candidate.stage
    );

  const progressPercent =
    currentStageIndex >= 0
      ? (currentStageIndex /
          (PIPELINE_STAGES.length - 1)) *
        100
      : 0;

  // =====================================================
  // INITIALS
  // =====================================================

  const initials =
    candidate?.name
      ?.split(" ")
      .filter(Boolean)
      .map(
        (word) => word[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() || "C";

  // =====================================================
  // RESUME
  // =====================================================

  const resumeUrl =
    candidate?.resumeUrl &&
    /^https?:\/\//i.test(
      candidate.resumeUrl
    )
      ? candidate.resumeUrl
      : "";

  const resumeName =
    candidate?.originalResumeName ||
    candidate?.resumeName ||
    "Resume.pdf";

  // =====================================================
  // ACTION CONDITIONS
  // =====================================================

  const canScheduleInterview =
    !isRejected &&
    candidate.stage === "Shortlisted" &&
    !interviewScheduled &&
    !interviewCompleted;

  const canPassInterview =
    candidate.stage === "Interview" &&
    interviewStatus === "Scheduled";

  const canMoveToOffer =
    candidate.stage === "Interview" &&
    interviewPassed;

  const canAcceptOffer =
    candidate.stage === "Offer Sent";

  // =====================================================
  // DOWNLOAD RESUME
  // =====================================================

  const handleDownloadResume = async () => {
    if (!resumeUrl || downloading) {
      return;
    }

    try {
      setDownloading(true);

      const response =
        await fetch(resumeUrl);

      if (!response.ok) {
        throw new Error(
          `Status: ${response.status}`
        );
      }

      const blob =
        await response.blob();

      const blobUrl =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = blobUrl;
      link.download = resumeName;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(
        blobUrl
      );
    } catch (error) {
      console.error(
        "RESUME DOWNLOAD ERROR:",
        error
      );

      toast.error(
        "Unable to download resume."
      );
    } finally {
      setDownloading(false);
    }
  };

  // =====================================================
  // REJECT CANDIDATE
  // =====================================================

  const handleReject = async () => {
    if (
      isRejected ||
      isHired ||
      rejecting
    ) {
      return;
    }

    if (!candidateId) {
      toast.error(
        "Candidate ID not found."
      );
      return;
    }

    try {
      setRejecting(true);

      const response =
        await rejectCandidate(
          candidateId
        );

      const updatedCandidate =
        response?.data?.data || {
          ...candidate,
          stage: "Rejected",
        };

      onReject?.(
        updatedCandidate
      );

      await onRefresh?.();

      toast.success(
        "Candidate rejected successfully."
      );

      onClose?.();
    } catch (error) {
      console.error(
        "REJECT ERROR:",
        error?.response?.data ||
          error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          "Failed to reject candidate."
      );
    } finally {
      setRejecting(false);
    }
  };

  // =====================================================
  // SCHEDULE INTERVIEW
  // =====================================================

  const handleScheduleInterview =
    () => {
      if (!candidateId) {
        toast.error(
          "Candidate ID not found."
        );
        return;
      }

      if (isRejected) {
        toast.error(
          "Rejected candidate cannot be scheduled."
        );
        return;
      }

      if (
        candidate.stage !==
        "Shortlisted"
      ) {
        toast.error(
          "Interview can only be scheduled for a shortlisted candidate."
        );
        return;
      }

      if (interviewScheduled) {
        toast.error(
          "Interview is already scheduled."
        );
        return;
      }

      if (interviewCompleted) {
        toast.error(
          "Completed interview cannot be scheduled again."
        );
        return;
      }

      onScheduleInterview?.(
        candidate
      );
    };

  // =====================================================
  // SCREENING DECISION
  // =====================================================

  const handleScreeningDecision =
    async (status) => {
      if (!candidateId) {
        toast.error(
          "Candidate ID not found."
        );
        return;
      }

      if (
        candidate.stage !==
        "Screening"
      ) {
        toast.error(
          "Screening decision is only available for candidates in Screening."
        );
        return;
      }

      try {
        setDecisionLoading(true);

        await completeScreening(
          candidateId,
          status
        );

        toast.success(
          status === "Passed"
            ? "Screening passed successfully."
            : "Screening updated successfully."
        );

        await onRefresh?.();

        onClose?.();
      } catch (error) {
        console.error(
          "SCREENING ERROR:",
          error?.response?.data ||
            error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Failed to update screening."
        );
      } finally {
        setDecisionLoading(false);
      }
    };

  // =====================================================
  // PASS INTERVIEW
  // =====================================================

  const handlePassInterview =
    async () => {
      if (!candidateId) {
        toast.error(
          "Candidate ID not found."
        );
        return;
      }

      if (!canPassInterview) {
        toast.error(
          "Only a scheduled interview can be passed."
        );
        return;
      }

      try {
        setDecisionLoading(true);

        await passInterview(
          candidateId
        );

        toast.success(
          "Interview passed successfully. Candidate is ready to move to offer."
        );

        await onRefresh?.();

        onClose?.();
      } catch (error) {
        console.error(
          "PASS INTERVIEW ERROR:",
          error?.response?.data ||
            error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.response?.data
              ?.error ||
            "Failed to pass interview."
        );
      } finally {
        setDecisionLoading(false);
      }
    };

  // =====================================================
  // MOVE TO OFFER
  // =====================================================

  const handleMoveToOffer =
    () => {
      if (!candidateId) {
        toast.error(
          "Candidate ID not found."
        );
        return;
      }

      if (!canMoveToOffer) {
        toast.error(
          "Interview must be passed before moving to offer."
        );
        return;
      }

      onOpenOfferModal?.(
        candidate
      );
    };

  // =====================================================
  // OFFER DECISION
  // =====================================================

  const handleOfferDecision =
    async (status) => {
      if (!candidateId) {
        toast.error(
          "Candidate ID not found."
        );
        return;
      }

      if (
        status === "Accepted" &&
        onAcceptOffer
      ) {
        await onAcceptOffer(
          candidate
        );

        return;
      }

      try {
        setDecisionLoading(true);

        await updateOfferStatus(
          candidateId,
          {
            status,
            rejectionReason:
              status === "Rejected"
                ? "Candidate declined offer"
                : "",
          }
        );

        toast.success(
          `Offer ${status.toLowerCase()} successfully.`
        );

        await onRefresh?.();

        onClose?.();
      } catch (error) {
        console.error(
          "OFFER STATUS ERROR:",
          error?.response?.data ||
            error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Failed to update offer status."
        );
      } finally {
        setDecisionLoading(
          false
        );
      }
    };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[840px] overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-base font-bold text-slate-800">
            Candidate Profile
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-xl text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="max-h-[65vh] overflow-y-auto">

          {/* =================================================
              PROFILE HEADER
          ================================================= */}

          <div className="flex items-center justify-between px-6 py-5">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-base font-bold text-white">
                {initials}
              </div>

              <div>

                <h3 className="text-base font-bold text-slate-800">
                  {candidate.name}
                </h3>

                <p className="mt-0.5 text-sm text-slate-500">
                  Applied for{" "}
                  {candidate.role ||
                    "—"}{" "}
                  ·{" "}
                  {candidate.experience ||
                    "Experience not specified"}
                </p>

              </div>

            </div>

            <ScoreCircle
              score={
                candidate.score || 0
              }
              color={
                isRejected
                  ? "#c83b3b"
                  : "#159570"
              }
            />

          </div>

          {/* =================================================
              PIPELINE
          ================================================= */}

          <div className="px-6">

            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Pipeline Stage
            </h4>

            {isRejected ? (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                This candidate has been rejected.
              </div>
            ) : (
              <div className="relative flex items-start justify-between pb-3">

                <div className="absolute left-3 right-3 top-3 h-0.5 bg-slate-200" />

                <div
                  className="absolute left-3 top-3 h-0.5 bg-emerald-500"
                  style={{
                    width: `${progressPercent}%`,
                  }}
                />

                {PIPELINE_STAGES.map(
                  (
                    stage,
                    index
                  ) => {

                    const isDone =
                      index <
                      currentStageIndex;

                    const isCurrent =
                      index ===
                      currentStageIndex;

                    return (
                      <div
                        key={stage}
                        className="relative z-10 flex flex-col items-center"
                      >

                        <div
                          className={
                            "flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-bold " +
                            (isDone
                              ? "bg-emerald-500 text-white"
                              : isCurrent
                              ? "bg-blue-600 text-white"
                              : "border-2 border-slate-200 bg-white text-slate-400")
                          }
                        >
                          {isDone
                            ? "✓"
                            : isCurrent
                            ? "•"
                            : index + 1}
                        </div>

                        <span className="mt-1.5 text-[11px] font-medium text-slate-500">
                          {stage}
                        </span>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

          {/* =================================================
              CONTACT & DOCUMENTS
          ================================================= */}

          <div className="mt-6 px-6">

            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Contact & Documents
            </h4>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Email
                </label>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                  {candidate.email ||
                    "—"}
                </div>

              </div>

              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Phone
                </label>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                  {candidate.phone ||
                    "—"}
                </div>

              </div>

            </div>

            {/* RESUME */}

            <div className="mt-3">

              {resumeUrl ? (
                <div className="flex items-center gap-2">

                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">

                    <span>
                      📄
                    </span>

                    <span className="truncate text-xs font-semibold text-slate-700">
                      {resumeName}
                    </span>

                  </div>

                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </a>

                  <button
                    type="button"
                    onClick={
                      handleDownloadResume
                    }
                    disabled={
                      downloading
                    }
                    className="shrink-0 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {downloading
                      ? "Downloading..."
                      : "Download Resume"}
                  </button>

                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-400">
                  No resume uploaded.
                </div>
              )}

            </div>

          </div>

          {/* =================================================
              APPLICATION DETAILS
          ================================================= */}

          <div className="mt-6 px-6">

            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Application Details
            </h4>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Current Salary (PKR)
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                  {candidate.currentSalary != null
                    ? candidate.currentSalary
                    : "—"}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Expected Salary (PKR)
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                  {candidate.expectedSalary != null
                    ? candidate.expectedSalary
                    : "—"}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Notice Period
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                  {candidate.noticePeriod || "—"}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Current Resident City
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                  {candidate.currentCity || "—"}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Willing to Relocate / Onsite Role
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                  {candidate.willingToRelocate === true
                    ? "Yes"
                    : candidate.willingToRelocate === false
                    ? "No"
                    : "—"}
                </div>
              </div>

            </div>

          </div>

          {/* =================================================
              SKILLS
          ================================================= */}

          <div className="mt-6 px-6">

            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Skills Matched
            </h4>

            <div className="flex flex-wrap gap-2">

              {candidate.skills?.length ? (
                candidate.skills.map(
                  (
                    skill,
                    index
                  ) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                    >
                      {skill}
                    </span>
                  )
                )
              ) : (
                <span className="text-xs text-slate-400">
                  No skills recorded
                </span>
              )}

            </div>

          </div>

          {/* =================================================
              RECRUITER NOTES
          ================================================= */}

          <div className="mt-6 px-6">

            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Recruiter Notes
            </h4>

            {candidate.notes?.length ? (
              <div className="space-y-2">

                {candidate.notes.map(
                  (
                    note,
                    index
                  ) => (
                    <div
                      key={
                        note._id ||
                        index
                      }
                      className="rounded-xl bg-slate-100 px-3.5 py-3 text-sm text-slate-500"
                    >
                      <span className="font-semibold text-slate-800">
                        {note.author}
                      </span>{" "}
                      —{" "}
                      {note.text}
                    </div>
                  )
                )}

              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No notes yet.
              </p>
            )}

          </div>
{/* =====================================================
    CANDIDATE FEEDBACK
===================================================== */}

<div className="mt-6 px-6 pb-6">
  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
    Candidate Feedback
  </h4>

  {feedbackLoading ? (
    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
      Loading interview feedback...
    </div>
  ) : !candidateFeedback ? (
    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
      No candidate feedback submitted yet.
    </div>
  ) : (
    <div className="space-y-2">

      {/* RECOMMENDATION + RATING */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Recommendation */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-xs font-semibold text-slate-400">
            Recommendation:
          </span>

          <span
            className={getRecommendationBadgeClasses(
              candidateFeedback?.recommendation
            )}
          >
            {candidateFeedback?.recommendation || "N/A"}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-xs font-semibold text-slate-400">
            Overall Rating:
          </span>

          <span className="text-sm font-bold text-slate-800">
            {candidateFeedback?.overallRating ?? "N/A"}
          </span>

          <span className="text-xs text-slate-400">
            / 5
          </span>
        </div>

      </div>

    </div>
  )}
</div>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">

          {!readOnly && (
            <>

              <div className="flex flex-wrap items-center gap-2">

                {/* REJECT */}

                {!isRejected && !isHired && (
                  <button
                    type="button"
                    onClick={
                      handleReject
                    }
                    disabled={
                      rejecting ||
                      decisionLoading
                    }
                    className="rounded-lg bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    {rejecting
                      ? "Rejecting..."
                      : "Reject Candidate"}
                  </button>
                )}

                {/* SCREENING */}

                {candidate.stage ===
                  "Screening" && (
                  <button
                    type="button"
                    disabled={
                      decisionLoading
                    }
                    onClick={() =>
                      handleScreeningDecision(
                        "Passed"
                      )
                    }
                    className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {decisionLoading
                      ? "Processing..."
                      : "Pass Screening"}
                  </button>
                )}

                {/* PASS INTERVIEW */}

                {canPassInterview && (
                  <button
                    type="button"
                    disabled={
                      decisionLoading
                    }
                    onClick={
                      handlePassInterview
                    }
                    className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {decisionLoading
                      ? "Processing..."
                      : "Pass Interview"}
                  </button>
                )}

                {/* MOVE TO OFFER */}

                {canMoveToOffer && (
                  <button
                    type="button"
                    disabled={
                      decisionLoading
                    }
                    onClick={
                      handleMoveToOffer
                    }
                    className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Move to Offer Letter
                  </button>
                )}

                {/* ACCEPT OFFER */}

                {canAcceptOffer && (
                  <button
                    type="button"
                    disabled={
                      decisionLoading
                    }
                    onClick={() =>
                      handleOfferDecision(
                        "Accepted"
                      )
                    }
                    className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Accept Offer
                  </button>
                )}

              </div>

              <div className="ml-auto flex items-center gap-2">

                {/* SCHEDULE INTERVIEW */}

                {canScheduleInterview && (
                  <button
                    type="button"
                    onClick={
                      handleScheduleInterview
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Schedule Interview
                  </button>
                )}

                {/* INTERVIEW SCHEDULED */}

                {candidate.stage ===
                  "Interview" &&
                  interviewScheduled && (
                    <span className="rounded-lg bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
                      Interview Scheduled
                    </span>
                  )}

                {/* CLOSE */}

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>

              </div>

            </>
          )}

          {readOnly && (
            <div className="ml-auto">

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default CandidateProfile;