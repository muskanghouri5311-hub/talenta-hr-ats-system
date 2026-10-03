import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  fetchAllInterviews,
  cancelInterview,
  rescheduleInterview,
  scheduleInterview,
} from "../../lib/api/interviewApi";

import ScheduleInterviewModal from "../../components/ui/ScheduleInterviewModal";

function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedInterview, setSelectedInterview] =
    useState(null);

  const [showReschedule, setShowReschedule] =
    useState(false);

  const [showScheduleNew, setShowScheduleNew] =
    useState(false);

  // =====================================================
  // LOAD INTERVIEWS
  // =====================================================

  const loadInterviews = async () => {
    try {
      setLoading(true);

      const response = await fetchAllInterviews();

      const data =
        response?.data?.data ||
        response?.data?.interviews ||
        response?.data ||
        [];

      setInterviews(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "GET INTERVIEWS ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to load interviews."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadInterviews();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  // =====================================================
  // SCHEDULE NEW INTERVIEW
  // =====================================================

  const handleScheduleNew = async (
    candidatePayload,
    interviewPayload
  ) => {
    const candidateId =
      candidatePayload?._id ||
      candidatePayload?.id ||
      candidatePayload?.candidateId;

    if (!candidateId) {
      toast.error("Candidate ID not found.");
      throw new Error("Candidate ID not found");
    }

    try {
      await scheduleInterview({
        candidateId,
        round: interviewPayload?.round,
        mode: interviewPayload?.mode,
        date: interviewPayload?.date,
        time: interviewPayload?.time,
        duration: Number(
          interviewPayload?.duration
        ),
        interviewerId:
          interviewPayload?.interviewerId,
        location:
          interviewPayload?.location || "",
        notes:
          interviewPayload?.notes || "",
      });

      toast.success(
        "Interview scheduled successfully."
      );

      setShowScheduleNew(false);

      await loadInterviews();
    } catch (error) {
      console.error(
        "SCHEDULE ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to schedule interview."
      );

      throw error;
    }
  };

  // =====================================================
  // CANCEL INTERVIEW
  //
  // IMPORTANT:
  // Cancel button UI is NOT in this page.
  // It exists only inside ScheduleInterviewModal.
  // =====================================================

  const handleCancel = async (interview) => {
    const interviewId =
      interview?._id ||
      interview?.id ||
      selectedInterview?._id ||
      selectedInterview?.id;

    if (!interviewId) {
      toast.error("Interview ID not found.");
      return;
    }

    // Completed interview cannot be cancelled
    if (interview?.status === "Completed") {
      toast.error(
        "Completed interview cannot be cancelled."
      );
      return;
    }

    // Already cancelled
    if (interview?.status === "Cancelled") {
      toast.error(
        "This interview is already cancelled."
      );
      return;
    }

    try {
      await cancelInterview(interviewId);

      toast.success(
        "Interview cancelled successfully."
      );

      setShowReschedule(false);
      setSelectedInterview(null);

      await loadInterviews();
    } catch (error) {
      console.error(
        "CANCEL ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to cancel interview."
      );

      throw error;
    }
  };

  // =====================================================
  // RESCHEDULE
  // =====================================================

  const handleReschedule = async (
    candidatePayload,
    interviewPayload
  ) => {
    const interviewId =
      selectedInterview?._id ||
      selectedInterview?.id ||
      interviewPayload?.interviewId;

    if (!interviewId) {
      toast.error("Interview ID not found.");
      throw new Error("Interview ID not found");
    }

    // Completed interview cannot be rescheduled
    if (
      selectedInterview?.status ===
      "Completed"
    ) {
      toast.error(
        "Completed interview cannot be rescheduled."
      );
      return;
    }

    // Cancelled interview cannot be rescheduled
    if (
      selectedInterview?.status ===
      "Cancelled"
    ) {
      toast.error(
        "Cancelled interview cannot be rescheduled."
      );
      return;
    }

    try {
      await rescheduleInterview(
        interviewId,
        {
          date: interviewPayload?.date,
          time: interviewPayload?.time,
        }
      );

      toast.success(
        "Interview rescheduled successfully."
      );

      setShowReschedule(false);
      setSelectedInterview(null);

      await loadInterviews();
    } catch (error) {
      console.error(
        "RESCHEDULE ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to reschedule interview."
      );

      throw error;
    }
  };

  // =====================================================
  // OPEN RESCHEDULE
  // =====================================================

  const openRescheduleModal = (
    interview
  ) => {
    // Completed cannot reschedule
    if (
      interview?.status ===
      "Completed"
    ) {
      toast.error(
        "Completed interview cannot be rescheduled."
      );
      return;
    }

    // Cancelled cannot reschedule
    if (
      interview?.status ===
      "Cancelled"
    ) {
      toast.error(
        "Cancelled interview cannot be rescheduled."
      );
      return;
    }

    setSelectedInterview(interview);
    setShowReschedule(true);
  };

  // =====================================================
  // CLOSE RESCHEDULE
  // =====================================================

  const closeRescheduleModal = () => {
    setShowReschedule(false);
    setSelectedInterview(null);
  };

  // =====================================================
  // CLOSE SCHEDULE
  // =====================================================

  const closeScheduleModal = () => {
    setShowScheduleNew(false);
  };

  // =====================================================
  // STATUS BADGE
  // =====================================================

  const getStatusBadge = (
    status
  ) => {
    switch (status) {
      case "Scheduled":
        return "bg-emerald-100 text-emerald-700";

      case "Confirmed":
        return "bg-emerald-100 text-emerald-700";

      case "Cancelled":
        return "bg-rose-100 text-rose-700";

      case "Completed":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDateBadge = (
    dateStr
  ) => {
    if (!dateStr) {
      return "N/A";
    }

    if (
      typeof dateStr === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(
        dateStr
      )
    ) {
      const [
        year,
        month,
        day,
      ] = dateStr
        .split("-")
        .map(Number);

      const dateObj = new Date(
        year,
        month - 1,
        day
      );

      return dateObj.toLocaleDateString(
        "en-US",
        {
          weekday: "short",
          month: "short",
          day: "numeric",
        }
      );
    }

    if (
      typeof dateStr === "string" &&
      dateStr.includes("T")
    ) {
      const datePart =
        dateStr.split("T")[0];

      const [
        year,
        month,
        day,
      ] = datePart
        .split("-")
        .map(Number);

      if (year && month && day) {
        const dateObj = new Date(
          year,
          month - 1,
          day
        );

        return dateObj.toLocaleDateString(
          "en-US",
          {
            weekday: "short",
            month: "short",
            day: "numeric",
          }
        );
      }
    }

    const dateObj = new Date(
      dateStr
    );

    if (
      Number.isNaN(
        dateObj.getTime()
      )
    ) {
      return dateStr;
    }

    return dateObj.toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric",
      }
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Loading interviews...
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-8">

      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Interviews
          </h1>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Manage scheduled interviews
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowScheduleNew(true)
          }
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <span>+</span>
          Schedule Interview
        </button>
      </div>

      {/* EMPTY */}

      {interviews.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-700">
            No interviews scheduled
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Schedule an interview to see it here.
          </p>
        </div>
      )}

      {/* INTERVIEWS */}

      {interviews.length > 0 && (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {interviews.map(
            (interview) => {
              const candidate =
                interview?.candidateId;

              const interviewer =
                interview?.interviewerId;

              const status =
                interview?.status === "Confirmed"
                  ? "Scheduled"
                  : interview?.status;

              const interviewId =
                interview?._id ||
                interview?.id;

              const canReschedule =
                status === "Scheduled";

              return (
                <div
                  key={interviewId}
                  className="flex flex-col gap-3 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >

                  {/* LEFT */}

                  <div className="flex items-center gap-3">

                    <div className="flex min-w-26.25 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-center">

                      <span className="text-xs font-semibold text-slate-900">
                        {interview?.time ||
                          "N/A"}
                      </span>

                      <span className="mt-1 text-xs text-slate-500">
                        {formatDateBadge(
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

                        {interview?.round &&
                          ` · ${interview.round}`}
                      </p>
                    </div>

                  </div>

                  {/* RIGHT */}

                  <div className="flex flex-wrap items-center gap-2">

                    {interview?.mode && (
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                        {interview.mode}
                      </span>
                    )}

                    <span className="text-xs font-medium text-slate-600">
                      {interviewer?.name ||
                        interviewer?.username ||
                        "Unknown"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                        status
                      )}`}
                    >
                      {status ||
                        "Unknown"}
                    </span>

                    {/* =================================
                        ONLY RESCHEDULE BUTTON
                        ================================= */}

                    <button
                      type="button"
                      disabled={
                        !canReschedule
                      }
                      onClick={() =>
                        openRescheduleModal(
                          interview
                        )
                      }
                      className={
                        canReschedule
                          ? "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          : "cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400"
                      }
                    >
                      Reschedule
                    </button>

                  </div>
                </div>
              );
            }
          )}

        </div>
      )}

      {/* ================================================
          RESCHEDULE MODAL
          Cancel Interview is INSIDE this modal.
          ================================================ */}

      {showReschedule &&
        selectedInterview && (
          <ScheduleInterviewModal
            isOpen={
              showReschedule
            }
            candidate={
              selectedInterview?.candidateId
            }
            interview={
              selectedInterview
            }
            mode="reschedule"
            onClose={
              closeRescheduleModal
            }
            onSubmit={
              handleReschedule
            }
            onCancelInterview={
              handleCancel
            }
          />
        )}

      {/* ================================================
          NEW SCHEDULE MODAL
          ================================================ */}

      {showScheduleNew && (
        <ScheduleInterviewModal
          isOpen={
            showScheduleNew
          }
          mode="schedule"
          onClose={
            closeScheduleModal
          }
          onSubmit={
            handleScheduleNew
          }
        />
      )}

    </div>
  );
}

export default Interviews;