import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getRecruiterPerformance,
  exportReport,
} from "../../lib/api/reportsApi";

const EXPORTS = [
  ["pdf", "pdf", "Export PDF"],
  ["excel", "xlsx", "Export Excel"],
  ["csv", "csv", "Export CSV"],
];

function ReportsAnalytics() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");

  const loadReport = async (start = "", end = "") => {
    try {
      setLoading(true);

      const res = await getRecruiterPerformance(start, end);

      setRows(
        Array.isArray(res?.data?.data)
          ? res.data.data
          : []
      );
    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          "Failed to load report."
      );

      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const applyFilters = () => {
    if (startDate && endDate && startDate > endDate) {
      return toast.error(
        "Start date cannot be after end date."
      );
    }

    const newFilters = {
      startDate,
      endDate,
    };

    setFilters(newFilters);
    loadReport(startDate, endDate);
  };

  const exportFile = async (format, extension) => {
    try {
      setExporting(format);

      const res = await exportReport(
        format,
        filters.startDate,
        filters.endDate
      );

      const disposition =
        res?.headers?.["content-disposition"];

      const match = disposition?.match(
        /filename="?([^"]+)"?/i
      );

      const filename =
        match?.[1] ||
        `recruiter-performance-report.${extension}`;

      const blob =
        res.data instanceof Blob
          ? res.data
          : new Blob([res.data]);

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success(
        `Report downloaded as ${extension.toUpperCase()}.`
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to export report.");
    } finally {
      setExporting("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 md:p-8">
      <div className="space-y-4">

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-slate-700">
              Reports & Analytics
            </h1>

            <p className="mt-1 text-[11px] text-slate-500">
              Export hiring data for leadership review
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-2">
            {EXPORTS.map(
              ([format, extension, label]) => (
                <button
                  key={format}
                  type="button"
                  onClick={() =>
                    exportFile(format, extension)
                  }
                  disabled={exporting === format}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {exporting === format
                    ? "Exporting..."
                    : label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Report Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          {/* Title + Filters */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            {/* Recruiter Performance */}
            <div>
              <h2 className="text-[18px] font-semibold text-slate-800">
                Recruiter performance
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                Hiring performance by recruiter
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3">

              {/* Start Date */}
              <div className="min-w-32 flex-1 sm:flex-none">
                <label className="mb-1 block text-[9px] font-semibold text-slate-500">
                  Start date
                </label>

                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) =>
                    setStartDate(e.target.value)
                  }
                  className="h-8 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 sm:w-35"
                />
              </div>

              {/* End Date */}
              <div className="min-w-32 flex-1 sm:flex-none">
                <label className="mb-1 block text-[9px] font-semibold text-slate-500">
                  End date
                </label>

                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) =>
                    setEndDate(e.target.value)
                  }
                  className="h-8 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 sm:w-35"
                />
              </div>

              {/* Apply Filters */}
              <button
                type="button"
                onClick={applyFilters}
                disabled={loading}
                className="h-8 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Apply Filters
              </button>
            </div>
          </div>
{/* ================= DATA SECTION ================= */}
<div className="mt-2">

  {/* Headings */}
  <div className="flex bg-slate-50 px-6 py-2 text-[12px] font-semibold uppercase text-slate-500">
    <div className="w-[20%]">
      Recruiter
    </div>

    <div className="w-[25%]">
      Hires
    </div>

    <div className="w-[50%]">
      Avg TTH
    </div>
  </div>

  {/* Loading */}
  {loading ? (
    <div className="p-5 text-center text-sm text-slate-500">
      Loading recruiter performance...
    </div>
  ) : rows.length === 0 ? (
    <div className="p-5 text-center text-sm text-slate-500">
      No hires found for the selected date range.
    </div>
  ) : (
    rows.map((row, index) => (
      <div
        key={`${row.recruiterId || row.recruiter || index}`}
        className="flex items-center border-t border-slate-100 px-6 py-3 text-left text-[13px] text-slate-700"
      >
        {/* Recruiter */}
        <div className="w-[20%] font-medium text-slate-800">
          {row.recruiter}
        </div>

        {/* Hires */}
        <div className="w-[25%]">
          {row.hires}
        </div>

        {/* Avg TTH */}
        <div className="w-[50%]">
          {row.avgTTH}d
        </div>
      </div>
    ))
  )}
</div>
        </div>
      </div>
    </div>
  );
}

export default ReportsAnalytics;
