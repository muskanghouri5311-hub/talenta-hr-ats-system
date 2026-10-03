import { useEffect, useState } from "react";

import StatCard from "../../components/ui/StatCard";
import HiringFunnel from "../../components/ui/HiringFunnel";
import RecentApplications from "../../components/ui/RecentApplications";
import DateRangePicker from "../../components/ui/DateRangePicker";
import { getDashboard } from "../../lib/api/dashboardApi";

function Dashboard() {
  const getToday = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(
    () =>
      sessionStorage.getItem("dashboardStartDate") ||
      getToday()
  );

  const [endDate, setEndDate] = useState(
    () =>
      sessionStorage.getItem("dashboardEndDate") ||
      getToday()
  );

  useEffect(() => {
    sessionStorage.setItem(
      "dashboardStartDate",
      startDate
    );

    sessionStorage.setItem(
      "dashboardEndDate",
      endDate
    );
  }, [startDate, endDate]);

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getDashboard(
          startDate,
          endDate
        );

        setDashboard(response.data.data);
      } catch (err) {
        console.error("DASHBOARD LOAD ERROR:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [startDate, endDate]);

  const stats = dashboard?.stats || {};
  const funnel = dashboard?.funnel || {};
  const applications =
    dashboard?.recentApplications || [];

  return (
    <div className="min-h-screen bg-slate-50 px-10 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Hiring overview
          </p>
        </div>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
      </div>

      {loading && (
        <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">
          Loading dashboard...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Open Roles"
              value={stats.openRoles ?? 0}
              subtitle="Historical snapshot"
            />

            <StatCard
              title="Active Candidates"
              value={stats.activeCandidates ?? 0}
              subtitle="Candidates in pipeline"
            />

            <StatCard
              title="Offer Acceptance"
              value={`${stats.offerAcceptance ?? 0}%`}
              subtitle="Accepted offers"
              showProgress
            />

            <StatCard
              title="Avg. Time to Hire"
              value={`${stats.avgTimeToHire ?? 0}d`}
              subtitle="Application to hire"
              subtitleColor="text-slate-500"
            />
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
            <HiringFunnel data={funnel} />

            <RecentApplications
              applications={applications}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;