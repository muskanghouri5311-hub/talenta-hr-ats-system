import {
  useEffect,
  useReducer,
  useState,
} from "react";

import toast from "react-hot-toast";

import { getUsersLookup } from "../../lib/api/lookupApi";
import { fetchAllCandidates } from "../../lib/api/candidateApi";

// =====================================================
// INITIAL FORM
// =====================================================

const INITIAL_FORM = {
  candidateId: "",
  round: "Technical",
  mode: "Video Call",
  date: "",
  time: "",
  duration: "",
  interviewerId: "",
  location: "",
  notes: "",
};

// =====================================================
// INITIAL ERRORS
// =====================================================

const INITIAL_ERRORS = {
  candidateId: "",
  round: "",
  mode: "",
  date: "",
  time: "",
  duration: "",
  interviewerId: "",
  location: "",
  notes: "",
};

// =====================================================
// LOCAL DATE
// =====================================================

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// =====================================================
// API DATE -> INPUT DATE
// =====================================================

const getInputDate = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  if (
    typeof dateValue === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
  ) {
    return dateValue;
  }

  if (
    typeof dateValue === "string" &&
    dateValue.includes("T")
  ) {
    return dateValue.split("T")[0];
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return getLocalDateString(date);
};

// =====================================================
// REDUCER
// =====================================================

function formReducer(form, action) {
  switch (action.type) {
    case "reset":
      return {
        ...INITIAL_FORM,
      };

    case "update":
      return {
        ...form,
        [action.field]: action.value,
      };

    case "setForm":
      return {
        ...INITIAL_FORM,
        ...action.value,
      };

    default:
      return form;
  }
}

function errorsReducer(errors, action) {
  switch (action.type) {
    case "reset":
      return {
        ...INITIAL_ERRORS,
      };

    case "set":
      return action.value;

    case "clear":
      return {
        ...errors,
        [action.field]: "",
      };

    default:
      return errors;
  }
}

// =====================================================
// COMPONENT
// =====================================================

function ScheduleInterviewModal({
  isOpen,
  candidate,
  onClose,
  onSubmit,
  onCancelInterview,
  mode = "schedule",
  interview = null,
}) {
  // =====================================================
  // STATE
  // =====================================================

  const [form, dispatchForm] = useReducer(
    formReducer,
    INITIAL_FORM
  );

  const [errors, dispatchErrors] = useReducer(
    errorsReducer,
    INITIAL_ERRORS
  );

  const [candidates, setCandidates] = useState([]);

  const [interviewers, setInterviewers] =
    useState([]);

  const [loadingCandidates, setLoadingCandidates] =
    useState(false);

  const [
    loadingInterviewers,
    setLoadingInterviewers,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [cancelling, setCancelling] =
    useState(false);

  // =====================================================
  // MODES
  // =====================================================

  const isReschedule =
    mode === "reschedule";

  /*
   * TRUE when modal is opened directly for
   * a particular candidate.
   */
  const isDirectCandidate =
    !isReschedule && Boolean(candidate);

  /*
   * Candidate can be selected manually only when:
   *
   * 1. Normal schedule mode
   * 2. No candidate was passed directly
   */
  const canSelectCandidate =
    !isReschedule &&
    !isDirectCandidate;

  // =====================================================
  // ACTIVE CANDIDATE
  // =====================================================

  const activeCandidate =
    candidate ||
    interview?.candidateId ||
    null;

  // =====================================================
  // ACTIVE CANDIDATE ID
  // =====================================================

  const activeCandidateId =
    typeof activeCandidate === "object"
      ? activeCandidate?._id ||
      activeCandidate?.id ||
      activeCandidate?.candidateId ||
      ""
      : activeCandidate || "";

  // =====================================================
  // LOAD CANDIDATES
  //
  // ONLY NORMAL SCHEDULE
  // AND ONLY WHEN NO DIRECT CANDIDATE
  // =====================================================

  useEffect(() => {
    if (
      !isOpen ||
      isReschedule ||
      isDirectCandidate
    ) {
      return;
    }

    const loadCandidates = async () => {
      try {
        setLoadingCandidates(true);

        const response =
          await fetchAllCandidates();

        const candidateData =
          response?.data?.data ||
          response?.data?.candidates ||
          response?.data ||
          [];

        const allCandidates =
          Array.isArray(candidateData)
            ? candidateData
            : [];

        /*
         * Only candidates that are allowed
         * to schedule interview.
         */
        const eligibleCandidates =
          allCandidates.filter((item) =>
            [
              "Applied",
              "Screening",
              "Shortlisted",
            ].includes(item?.stage)
          );

        setCandidates(
          eligibleCandidates
        );
      } catch (error) {
        console.error(
          "GET CANDIDATES ERROR:",
          error?.response?.data || error
        );

        setCandidates([]);

        toast.error(
          error?.response?.data?.message ||
          "Failed to load candidates."
        );
      } finally {
        setLoadingCandidates(false);
      }
    };

    loadCandidates();
  }, [
    isOpen,
    isReschedule,
    isDirectCandidate,
  ]);

  // =====================================================
  // LOAD INTERVIEWERS
  // =====================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadInterviewers = async () => {
      try {
        setLoadingInterviewers(true);

        const response =
          await getUsersLookup(
            "Interviewer"
          );

        const users =
          response?.data?.data ||
          response?.data?.users ||
          response?.data ||
          [];

        const normalizedUsers =
          Array.isArray(users)
            ? users.map((user) => ({
              ...user,

              id:
                user?.id ||
                user?._id,

              _id:
                user?._id ||
                user?.id,

              name:
                user?.name ||
                user?.fullName ||
                user?.username ||
                "Unknown User",

              department:
                user?.department ||
                "No Department",

            }))
            : [];

        setInterviewers(
          normalizedUsers
        );
      } catch (error) {
        console.error(
          "GET INTERVIEWERS ERROR:",
          error?.response?.data || error
        );

        setInterviewers([]);

        toast.error(
          error?.response?.data?.message ||
          "Failed to load interviewers."
        );
      } finally {
        setLoadingInterviewers(false);
      }
    };

    loadInterviewers();
  }, [isOpen]);

  // =====================================================
  // LOAD FORM
  // =====================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Clear previous errors
    dispatchErrors({
      type: "reset",
    });

    // ===================================================
    // RESCHEDULE
    // ===================================================

    if (
      isReschedule &&
      interview
    ) {
      const interviewerId =
        typeof interview.interviewerId ===
          "object"
          ? interview.interviewerId?._id ||
          interview.interviewerId?.id
          : interview.interviewerId;

      const interviewCandidate =
        interview.candidateId;

      const candidateId =
        typeof interviewCandidate ===
          "object"
          ? interviewCandidate?._id ||
          interviewCandidate?.id
          : interviewCandidate;

      dispatchForm({
        type: "setForm",
        value: {
          candidateId:
            candidateId || "",

          round:
            interview.round ||
            "Technical",

          mode:
            interview.mode ||
            "Video Call",

          date:
            getInputDate(
              interview.date
            ),

          time:
            interview.time || "",

          duration:
            interview.duration
              ? String(
                interview.duration
              )
              : "",

          interviewerId:
            interviewerId || "",

          location:
            interview.location || "",

          notes:
            interview.notes || "",
        },
      });

      return;
    }

    // ===================================================
    // NORMAL SCHEDULE
    // ===================================================

    dispatchForm({
      type: "setForm",
      value: {
        ...INITIAL_FORM,

        /*
         * If candidate was opened directly
         * from Candidate Profile,
         * automatically select its ID.
         */
        candidateId:
          activeCandidateId || "",
      },
    });
  }, [
    isOpen,
    isReschedule,
    interview,
    activeCandidateId,
  ]);

  // =====================================================
  // UPDATE FORM
  // =====================================================

  const update = (
    field,
    value
  ) => {
    dispatchForm({
      type: "update",
      field,
      value,
    });

    if (value) {
      dispatchErrors({
        type: "clear",
        field,
      });
    }
  };

  // =====================================================
  // MODE CHANGE
  // =====================================================

  const handleModeChange = (newMode) => {
    /*
     * Change mode normally.
     */
    dispatchForm({
      type: "update",
      field: "mode",
      value: newMode,
    });

    /*
     * Clear previous meeting link/location/phone.
     *
     * Example:
     *
     * Video Call
     * Google Meet link
     *
     * ↓ change to
     *
     * Onsite
     *
     * Old Google Meet link is removed.
     */
    dispatchForm({
      type: "update",
      field: "location",
      value: "",
    });

    /*
     * Clear location validation error.
     */
    dispatchErrors({
      type: "set",
      value: {
        ...errors,
        mode: "",
        location: "",
      },
    });
  };

  // =====================================================
  // VALIDATE FORM
  // =====================================================

  const validateForm = () => {
    const newErrors = {
      ...INITIAL_ERRORS,
    };

    const candidateId =
      form.candidateId ||
      activeCandidateId;

    // ===================================================
    // Candidate
    // ===================================================

    if (!candidateId) {
      newErrors.candidateId =
        "Candidate is required.";
    }

    // ===================================================
    // Round
    // ===================================================

    if (!form.round) {
      newErrors.round =
        "Interview round is required.";
    }

    // ===================================================
    // Mode
    // ===================================================

    if (!form.mode) {
      newErrors.mode =
        "Interview mode is required.";
    }

    // ===================================================
    // Date
    // ===================================================

    if (!form.date) {
      newErrors.date =
        "Interview date is required.";
    }

    // ===================================================
    // Time
    // ===================================================

    if (!form.time) {
      newErrors.time =
        "Interview time is required.";
    }

    // ===================================================
    // Duration
    // ===================================================

    if (!form.duration) {
      newErrors.duration =
        "Interview duration is required.";
    }

    // ===================================================
    // Interviewer
    // ===================================================

    if (!form.interviewerId) {
      newErrors.interviewerId =
        "Interviewer is required.";
    }

    // ===================================================
    // MODE-SPECIFIC LOCATION
    // ===================================================

    if (!form.location.trim()) {
      if (form.mode === "Video Call") {
        newErrors.location =
          "Meeting link is required for video call.";
      } else if (form.mode === "Onsite") {
        newErrors.location =
          "Office location is required for onsite interview.";
      } else if (form.mode === "Phone Call") {
        newErrors.location =
          "Phone number is required for phone call.";
      } else {
        newErrors.location =
          "Meeting link or location is required.";
      }
    }

    // ===================================================
    // PHONE CALL VALIDATION
    // ===================================================

    if (
      form.mode === "Phone Call" &&
      form.location.trim()
    ) {
      const phoneNumber =
        form.location.trim();

      const onlyNumbers =
        /^\d+$/.test(phoneNumber);

      if (!onlyNumbers) {
        newErrors.location =
          "Phone number should contain numbers only.";
      }

      if (
        onlyNumbers &&
        (phoneNumber.length < 10 ||
          phoneNumber.length > 15)
      ) {
        newErrors.location =
          "Please enter a valid phone number.";
      }
    }

    dispatchErrors({
      type: "set",
      value: newErrors,
    });

    return !Object.values(
      newErrors
    ).some(Boolean);
  };

  // =====================================================
  // SELECTED CANDIDATE
  // =====================================================

  const selectedCandidate =
    candidates.find(
      (item) =>
        String(
          item?._id ||
          item?.id
        ) ===
        String(form.candidateId)
    ) ||
    activeCandidate;

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async () => {
    // ===================================================
    // VALIDATE
    // ===================================================

    const isValid =
      validateForm();

    if (!isValid) {
      return;
    }

    const candidateId =
      form.candidateId ||
      activeCandidateId;

    // ===================================================
    // RESCHEDULE PROTECTION
    // ===================================================

    if (
      isReschedule &&
      interview?.status ===
      "Completed"
    ) {
      toast.error(
        "Completed interview cannot be rescheduled."
      );

      return;
    }

    if (
      isReschedule &&
      interview?.status ===
      "Cancelled"
    ) {
      toast.error(
        "Cancelled interview cannot be rescheduled."
      );

      return;
    }

    try {
      setSubmitting(true);

      // =================================================
      // CANDIDATE PAYLOAD
      // =================================================

      const candidatePayload = {
        ...(selectedCandidate || {}),

        _id: candidateId,

        candidateId,
      };

      // =================================================
      // INTERVIEW PAYLOAD
      // =================================================

      const interviewPayload = {
        round:
          form.round,

        mode:
          form.mode,

        date:
          form.date,

        time:
          form.time,

        duration:
          Number(
            form.duration
          ),

        interviewerId:
          form.interviewerId,

        location:
          form.location.trim(),

        notes:
          form.notes,

        ...(isReschedule
          ? {
            interviewId:
              interview?._id ||
              interview?.id,
          }
          : {}),
      };

      await onSubmit(
        candidatePayload,
        interviewPayload
      );
    } catch (error) {
      console.error(
        `${mode.toUpperCase()} ERROR:`,
        error?.response?.data ||
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
        "Failed to save interview."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // CANCEL INTERVIEW
  // =====================================================

  const handleCancelInterview =
    async () => {
      if (
        !onCancelInterview ||
        !interview ||
        cancelling
      ) {
        return;
      }

      if (
        interview.status ===
        "Completed"
      ) {
        toast.error(
          "Completed interview cannot be cancelled."
        );

        return;
      }

      if (
        interview.status ===
        "Cancelled"
      ) {
        toast.error(
          "Interview is already cancelled."
        );

        return;
      }

      toast.warning(
        "Are you sure you want to cancel this interview?",
        {
          duration: Infinity,

          action: {
            label: "Cancel Interview",

            onClick: async () => {
              try {
                setCancelling(true);

                await onCancelInterview(
                  interview
                );
              } catch (error) {
                console.error(
                  "CANCEL INTERVIEW ERROR:",
                  error?.response?.data ||
                  error
                );
              } finally {
                setCancelling(false);
              }
            },
          },

          cancel: {
            label: "Keep Interview",
          },
        }
      );
    };

  // =====================================================
  // HIDE MODAL
  // =====================================================

  if (!isOpen) {
    return null;
  }

  // =====================================================
  // CAN CANCEL
  // =====================================================

  const canCancel =
    isReschedule &&
    interview?.status ===
      "Scheduled";

  // =====================================================
  // MODE LABEL
  // =====================================================

  const locationLabel =
    form.mode === "Video Call"
      ? "Meeting Link"
      : form.mode === "Onsite"
        ? "Office Location"
        : form.mode === "Phone Call"
          ? "Phone Number"
          : "Meeting Link / Location";

  // =====================================================
  // MODE PLACEHOLDER
  // =====================================================

  const locationPlaceholder =
    form.mode === "Video Call"
      ? "Google Meet / Zoom meeting link"
      : form.mode === "Onsite"
        ? "e.g. Meeting Room 2, Office Floor 1"
        : form.mode === "Phone Call"
          ? "e.g. 03001234567"
          : "Meeting link or office location";

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3">

      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">

          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isReschedule
                ? "Reschedule Interview"
                : "Schedule Interview"}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {isReschedule
                ? "Update interview date and time."
                : "Schedule a new interview round."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={
              submitting ||
              cancelling
            }
            className="text-xl leading-none text-slate-400 hover:text-slate-800 disabled:opacity-50"
          >
            ×
          </button>

        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="space-y-4 px-5 py-4">

          {/* =================================================
              CANDIDATE
          ================================================= */}

          <div>

            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Candidate{" "}
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={
                form.candidateId
              }
              onChange={(e) =>
                update(
                  "candidateId",
                  e.target.value
                )
              }
              disabled={
                submitting ||
                loadingCandidates ||
                !canSelectCandidate
              }
              className={`w-full rounded-lg border bg-white px-3 py-2 text-xs outline-none disabled:bg-slate-100 disabled:text-slate-500 ${errors.candidateId
                ? "border-red-500 focus:border-red-500"
                : "border-slate-200 focus:border-blue-500"
                }`}
            >

              <option value="">
                {loadingCandidates
                  ? "Loading candidates..."
                  : candidates.length ===
                    0 &&
                    canSelectCandidate
                    ? "No eligible candidates found"
                    : isDirectCandidate
                      ? selectedCandidate?.name ||
                      selectedCandidate?.fullName ||
                      "Selected Candidate"
                      : isReschedule
                        ? selectedCandidate?.name ||
                        selectedCandidate?.fullName ||
                        "Selected Candidate"
                        : "Select candidate"}
              </option>

              {candidates.map(
                (item) => {
                  const id =
                    item?._id ||
                    item?.id;

                  return (
                    <option
                      key={id}
                      value={id}
                    >
                      {item?.name ||
                        item?.fullName ||
                        "Unknown Candidate"}

                      {item?.role
                        ? ` — ${item.role}`
                        : ""}
                    </option>
                  );
                }
              )}

            </select>

            {isDirectCandidate && (
              <p className="mt-1 text-[10px] text-slate-400">
                Candidate is selected from
                the candidate profile.
              </p>
            )}

            {isReschedule && (
              <p className="mt-1 text-[10px] text-slate-400">
                Candidate cannot be changed
                during rescheduling.
              </p>
            )}

            {errors.candidateId && (
              <p className="mt-1 text-[11px] font-medium text-red-500">
                {errors.candidateId}
              </p>
            )}

          </div>

          {/* =================================================
              ROUND + MODE
          ================================================= */}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

            {/* ROUND */}

            <div>

              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Interview Round
              </label>

              <select
                value={
                  form.round
                }
                onChange={(e) =>
                  update(
                    "round",
                    e.target.value
                  )
                }
                disabled={
                  submitting ||
                  isReschedule
                }
                className={`w-full rounded-lg border bg-white px-3 py-2 text-xs outline-none disabled:bg-slate-100 disabled:text-slate-500 ${errors.round
                  ? "border-red-500"
                  : "border-slate-200 focus:border-blue-500"
                  }`}
              >

                <option value="Technical">
                  Technical
                </option>

                <option value="Final">
                  Final
                </option>

              </select>

              {errors.round && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.round}
                </p>
              )}

            </div>

            {/* MODE */}

            <div>

              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Mode
              </label>

              <select
                value={
                  form.mode
                }
                onChange={(e) =>
                  handleModeChange(
                    e.target.value
                  )
                }
                disabled={
                  submitting ||
                  isReschedule
                }
                className={`w-full rounded-lg border bg-white px-3 py-2 text-xs outline-none disabled:bg-slate-100 disabled:text-slate-500 ${errors.mode
                  ? "border-red-500"
                  : "border-slate-200 focus:border-blue-500"
                  }`}
              >

                <option value="Video Call">
                  Video Call
                </option>

                <option value="Onsite">
                  Onsite
                </option>

                <option value="Phone Call">
                  Phone Call
                </option>

              </select>

              {errors.mode && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.mode}
                </p>
              )}

            </div>

          </div>

          {/* =================================================
              DATE + TIME
          ================================================= */}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

            {/* DATE */}

            <div>

              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Date{" "}
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="date"
                value={
                  form.date
                }
                min={
                  getLocalDateString()
                }
                onChange={(e) =>
                  update(
                    "date",
                    e.target.value
                  )
                }
                disabled={
                  submitting
                }
                className={`w-full rounded-lg border px-3 py-2 text-xs outline-none disabled:bg-slate-100 ${errors.date
                  ? "border-red-500 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
                  }`}
              />

              {errors.date && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.date}
                </p>
              )}

            </div>

            {/* TIME */}

            <div>

              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Time{" "}
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="time"
                value={
                  form.time
                }
                onChange={(e) =>
                  update(
                    "time",
                    e.target.value
                  )
                }
                disabled={
                  submitting
                }
                className={`w-full rounded-lg border px-3 py-2 text-xs outline-none disabled:bg-slate-100 ${errors.time
                  ? "border-red-500 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
                  }`}
              />

              {errors.time && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.time}
                </p>
              )}

            </div>

          </div>

          {/* =================================================
              DURATION + INTERVIEWER
          ================================================= */}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

            {/* DURATION */}

            <div>

              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Duration{" "}
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                value={
                  form.duration
                }
                onChange={(e) =>
                  update(
                    "duration",
                    e.target.value
                  )
                }
                disabled={
                  submitting ||
                  isReschedule
                }
                className={`w-full rounded-lg border bg-white px-3 py-2 text-xs outline-none disabled:bg-slate-100 disabled:text-slate-500 ${errors.duration
                  ? "border-red-500"
                  : "border-slate-200 focus:border-blue-500"
                  }`}
              >

                <option value="">
                  Select duration
                </option>

                <option value="30">
                  30 minutes
                </option>

                <option value="45">
                  45 minutes
                </option>

                <option value="60">
                  60 minutes
                </option>

                <option value="90">
                  90 minutes
                </option>

              </select>

              {errors.duration && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.duration}
                </p>
              )}

            </div>

            {/* INTERVIEWER */}

            <div>

              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Interviewer{" "}
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                value={
                  form.interviewerId
                }
                onChange={(e) =>
                  update(
                    "interviewerId",
                    e.target.value
                  )
                }
                disabled={
                  loadingInterviewers ||
                  submitting ||
                  isReschedule
                }
                className={`w-full rounded-lg border bg-white px-3 py-2 text-xs outline-none disabled:bg-slate-100 disabled:text-slate-500 ${errors.interviewerId
                  ? "border-red-500"
                  : "border-slate-200 focus:border-blue-500"
                  }`}
              >

                <option value="">
                  {loadingInterviewers
                    ? "Loading interviewers..."
                    : interviewers.length ===
                      0
                      ? "No interviewers found"
                      : "Select interviewer"}
                </option>

                {interviewers.map(
                  (interviewer) => {
                    const id =
                      interviewer.id ||
                      interviewer._id;

                    return (
                      <option
                        key={id}
                        value={id}
                      >
                        {interviewer.name} — {interviewer.department}
                      </option>
                    );
                  }
                )}

              </select>

              {errors.interviewerId && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.interviewerId}
                </p>
              )}

            </div>

          </div>

          {/* =================================================
              LOCATION / MEETING LINK / PHONE
          ================================================= */}

          <div>

            <label className="mb-1 block text-xs font-semibold text-slate-700">

              {locationLabel}

              <span className="ml-1 text-red-500">
                *
              </span>

            </label>

            <input
              type={
                form.mode === "Phone Call"
                  ? "tel"
                  : "text"
              }
              value={
                form.location
              }
              onChange={(e) => {
                let value =
                  e.target.value;

                /*
                 * Phone Call:
                 * only numbers are allowed.
                 */
                if (
                  form.mode ===
                  "Phone Call"
                ) {
                  value =
                    value.replace(
                      /\D/g,
                      ""
                    );
                }

                update(
                  "location",
                  value
                );
              }}
              disabled={
                submitting ||
                isReschedule
              }
              placeholder={
                locationPlaceholder
              }
              inputMode={
                form.mode ===
                  "Phone Call"
                  ? "numeric"
                  : undefined
              }
              className={`w-full rounded-lg border px-3 py-2 text-xs outline-none disabled:bg-slate-100 disabled:text-slate-500 ${errors.location
                ? "border-red-500 focus:border-red-500"
                : "border-slate-200 focus:border-blue-500"
                }`}
            />

            {errors.location && (
              <p className="mt-1 text-[11px] font-medium text-red-500">
                {errors.location}
              </p>
            )}

          </div>

          {/* =================================================
              NOTES
          ================================================= */}

          <div>

            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Notes for Interviewer
            </label>

            <textarea
              value={
                form.notes
              }
              onChange={(e) =>
                update(
                  "notes",
                  e.target.value
                )
              }
              disabled={
                submitting ||
                isReschedule
              }
              placeholder="Add key evaluation points or instructions..."
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
            />

            {errors.notes && (
              <p className="mt-1 text-[11px] font-medium text-red-500">
                {errors.notes}
              </p>
            )}

          </div>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">

          {/* =================================================
              CANCEL INTERVIEW
          ================================================= */}

          <div>

            {canCancel && (
              <button
                type="button"
                onClick={
                  handleCancelInterview
                }
                disabled={
                  submitting ||
                  cancelling
                }
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelling
                  ? "Cancelling..."
                  : "Cancel Interview"}
              </button>
            )}

          </div>

          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <div className="flex gap-2">

            {/* CLOSE */}

            <button
              type="button"
              onClick={onClose}
              disabled={
                submitting ||
                cancelling
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Close
            </button>

            {/* SCHEDULE / RESCHEDULE */}

            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={
                submitting ||
                cancelling
              }
              className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : isReschedule
                  ? "Reschedule Interview"
                  : "Schedule Interview"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ScheduleInterviewModal;