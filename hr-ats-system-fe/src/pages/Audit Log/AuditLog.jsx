import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAuditLogs, exportAuditLogs } from "../../lib/api/auditlogApi";

function AuditLog() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    try {
      const response = await getAuditLogs({
        page: 1,
        limit: 20,
      });

      if (response.success) {
        setAuditLogs(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportAuditLogs();

      const blob = new Blob([response.data], {
        type: "text/csv",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "audit-logs.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Audit logs exported successfully");
    } catch (error) {
      console.error("Export Audit Logs Error:", error);
      toast.error("Failed to export audit logs");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAuditLogs();
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-50 px-4 sm:px-8 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[28px] font-bold leading-8 text-slate-700">
            Audit Log
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            System-wide activity, for compliance and traceability
          </p>
        </div>

        <button
          onClick={handleExport}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-slate-50"
        >
          Export CSV
        </button>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                User
              </th>

              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>

              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Module
              </th>

              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Timestamp
              </th>

              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                IP Address
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-3 py-6 text-center text-sm text-slate-500"
                >
                  Loading audit logs...
                </td>
              </tr>
            ) : auditLogs.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-3 py-6 text-center text-sm text-slate-500"
                >
                  No audit logs found.
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr
                  key={log._id}
                  className="border-b border-slate-200 last:border-b-0"
                >
                  <td className="px-3 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                    {log.user?.name || "System"}
                  </td>

                  <td className="px-3 py-3 text-sm text-slate-900">
                    {log.description || log.action}
                  </td>

                  <td className="px-3 py-3 text-sm text-slate-900 whitespace-nowrap">
                    {log.module}
                  </td>

                  <td className="px-3 py-3 text-sm font-mono font-medium text-slate-900 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </td>

                  <td className="px-3 py-3 text-sm font-mono font-medium text-slate-900 whitespace-nowrap">
                    {log.ipAddress || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLog;
