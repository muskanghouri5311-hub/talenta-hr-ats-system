
import {
  useEffect,
  useState,
} from "react";

import { toast } from "sonner";

import {
  getRecommendationOptions,
} from "../../lib/api/myinterviewApi";

const RATING_OPTIONS = [
  {
    value: 1,
    label: "1 — Poor",
  },
  {
    value: 2,
    label: "2 — Below Average",
  },
  {
    value: 3,
    label: "3 — Average",
  },
  {
    value: 4,
    label: "4 — Good",
  },
  {
    value: 5,
    label: "5 — Excellent",
  },
];

const FALLBACK_RECOMMENDATION_OPTIONS = [
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

function SubmitFeedbackModal({
  isOpen,
  interview,
  onClose,
  onSubmit,
}) {
  // =====================================================
  // FORM STATES
  // =====================================================

  const [overallRating, setOverallRating] =
    useState("");

  const [recommendation, setRecommendation] =
    useState("");

  const [
    recommendationOptions,
    setRecommendationOptions,
  ] = useState(
    FALLBACK_RECOMMENDATION_OPTIONS
  );

  const [
    technicalStrengths,
    setTechnicalStrengths,
  ] = useState("");

  const [concerns, setConcerns] =
    useState("");

  const [loadingOptions, setLoadingOptions] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  // =====================================================
  // VALIDATION STATES
  // =====================================================

  const [ratingError, setRatingError] =
    useState("");

  const [recommendationError, setRecommendationError] =
    useState("");

  // =====================================================
  // UPDATE FORM WHEN INTERVIEW CHANGES
  // =====================================================

  useEffect(() => {
    if (!isOpen || !interview) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const feedback =
        interview?.feedback;

      setOverallRating(
        feedback?.overallRating
          ? Number(feedback.overallRating)
          : ""
      );

      setRecommendation(
        feedback?.recommendation || ""
      );

      setTechnicalStrengths(
        feedback?.technicalStrengths || ""
      );

      setConcerns(
        feedback?.concerns || ""
      );

      // Clear validation messages
      setRatingError("");
      setRecommendationError("");
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    isOpen,
    interview,
  ]);

  // =====================================================
  // LOAD RECOMMENDATION OPTIONS
  // =====================================================

  useEffect(() => {
    if (!isOpen || !interview) {
      return;
    }

    let cancelled = false;

    const loadRecommendations = async () => {
      try {
        setLoadingOptions(true);

        const response =
          await getRecommendationOptions();

        const options =
          response?.data?.data || [];

        if (cancelled) {
          return;
        }

        if (
          Array.isArray(options) &&
          options.length > 0
        ) {
          setRecommendationOptions(
            options
          );

          /*
           * Existing feedback hai to
           * uski recommendation ko change
           * nahi karna.
           *
           * New feedback ke liye empty rahegi
           * taake required message show ho sake.
           */
          if (
            interview?.feedback
              ?.recommendation
          ) {
            setRecommendation(
              interview.feedback.recommendation
            );
          } else {
            setRecommendation("");
          }
        } else {
          setRecommendationOptions(
            FALLBACK_RECOMMENDATION_OPTIONS
          );

          if (
            interview?.feedback
              ?.recommendation
          ) {
            setRecommendation(
              interview.feedback.recommendation
            );
          } else {
            setRecommendation("");
          }
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "GET RECOMMENDATION OPTIONS ERROR:",
          error?.response?.data ||
            error
        );

        setRecommendationOptions(
          FALLBACK_RECOMMENDATION_OPTIONS
        );

        if (
          interview?.feedback
            ?.recommendation
        ) {
          setRecommendation(
            interview.feedback.recommendation
          );
        } else {
          setRecommendation("");
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    };

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    interview,
  ]);

  // =====================================================
  // HIDE MODAL
  // =====================================================

  if (!isOpen || !interview) {
    return null;
  }

  const candidate =
    interview?.candidateId;

  const hasExistingFeedback =
    Boolean(
      interview?.feedback?.submittedAt
    );

  // =====================================================
  // SUBMIT FEEDBACK
  // =====================================================

  const handleSubmit = async () => {
    let hasError = false;

    // Clear old errors
    setRatingError("");
    setRecommendationError("");

    // Overall Rating Required Validation
    if (
      overallRating === "" ||
      overallRating === null ||
      overallRating === undefined
    ) {
      setRatingError(
        "Overall rating is required."
      );
      hasError = true;
    } else if (
      Number(overallRating) < 1 ||
      Number(overallRating) > 5
    ) {
      setRatingError(
        "Please select a valid rating."
      );
      hasError = true;
    }

    // Recommendation Required Validation
    if (!recommendation) {
      setRecommendationError(
        "Recommendation is required."
      );
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      setSubmitting(true);

      const interviewId =
        interview?._id ||
        interview?.id;

      if (!interviewId) {
        toast.error(
          "Interview ID not found."
        );
        return;
      }

      await onSubmit(
        interviewId,
        {
          overallRating:
            Number(overallRating),

          recommendation,

          technicalStrengths:
            technicalStrengths || "",

          concerns:
            concerns || "",
        }
      );

      toast.success(
        "Feedback submitted successfully."
      );

      onClose();
    } catch (error) {
      console.error(
        "SUBMIT FEEDBACK ERROR:",
        error?.response?.data ||
          error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to submit feedback."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-start justify-between">

          <div>

            <h2 className="text-lg font-bold text-slate-900">
              {hasExistingFeedback
                ? "View Feedback"
                : "Submit Feedback"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {candidate?.name ||
                "Unknown Candidate"}

              {candidate?.role &&
                ` · ${candidate.role}`}

              {candidate?.stage &&
                ` · ${candidate.stage}`}
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-xl text-slate-400 hover:text-slate-700"
          >
            ×
          </button>

        </div>

        {/* ================================================= */}
        {/* FORM */}
        {/* ================================================= */}

        <div className="mt-5 space-y-4">

          {/* OVERALL RATING */}

          <div>

            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Overall Rating{" "}
              <span className="text-red-500 ml-1">
                *
              </span>
            </label>

            <select
              value={overallRating}
              onChange={(e) => {
                setOverallRating(
                  e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                );

                setRatingError("");
              }}
              disabled={
                hasExistingFeedback ||
                submitting
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 ${
                ratingError
                  ? "border-red-500"
                  : "border-slate-200"
              }`}
            >

              <option value="">
                Select Overall Rating
              </option>

              {RATING_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}

            </select>

            {ratingError && (
              <p className="mt-1 text-xs text-red-500">
                {ratingError}
              </p>
            )}

          </div>

          {/* RECOMMENDATION */}

          <div>

            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Recommendation{" "}
              <span className="text-red-500 ml-1">
                *
              </span>
            </label>

            <select
              value={recommendation}
              onChange={(e) => {
                setRecommendation(
                  e.target.value
                );

                setRecommendationError("");
              }}
              disabled={
                loadingOptions ||
                hasExistingFeedback ||
                submitting
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 ${
                recommendationError
                  ? "border-red-500"
                  : "border-slate-200"
              }`}
            >

              <option value="">
                Select Recommendation
              </option>

              {loadingOptions ? (
                <option value="" disabled>
                  Loading...
                </option>
              ) : (
                recommendationOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )
              )}

            </select>

            {recommendationError && (
              <p className="mt-1 text-xs text-red-500">
                {recommendationError}
              </p>
            )}

          </div>

          {/* TECHNICAL STRENGTHS */}

          <div>

            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Technical Strengths
            </label>

            <textarea
              value={
                technicalStrengths
              }
              onChange={(e) =>
                setTechnicalStrengths(
                  e.target.value
                )
              }
              disabled={
                hasExistingFeedback ||
                submitting
              }
              placeholder="What did the candidate do well?"
              rows={3}
              className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />

          </div>

          {/* CONCERNS */}

          <div>

            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Concerns / Gaps
            </label>

            <textarea
              value={concerns}
              onChange={(e) =>
                setConcerns(
                  e.target.value
                )
              }
              disabled={
                hasExistingFeedback ||
                submitting
              }
              placeholder="Any red flags or areas of concern?"
              rows={3}
              className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />

          </div>

        </div>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Close
          </button>

          {!hasExistingFeedback && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                submitting ||
                loadingOptions
              }
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : "Submit Feedback"}
            </button>
          )}

        </div>

      </div>
    </div>
  );
}

export default SubmitFeedbackModal;