const getInitials = (name = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const getAvatarColor = (index = 0) => {
  const colors = [
    "bg-blue-100 text-blue-600",
    "bg-yellow-100 text-yellow-600",
    "bg-orange-100 text-orange-600",
    "bg-purple-100 text-purple-600",
  ];

  return colors[index % colors.length];
};

const getStageStyle = (stage) => {
  switch (stage) {
    case "Screening":
      return "bg-blue-50 text-blue-600";

    case "Interview":
      return "bg-amber-50 text-amber-600";

    case "Shortlisted":
      return "bg-emerald-50 text-emerald-600";

    case "Rejected":
      return "bg-red-50 text-red-600";

    case "Hired":
      return "bg-emerald-50 text-emerald-600";

    case "Offer Sent":
      return "bg-violet-50 text-violet-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

function RecentApplications({ applications = [] }) {
  return (
    <div className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-900">
        Recent applications
      </h2>

      <div>
        {applications.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No applications found.
          </p>
        ) : (
          applications.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b border-slate-200 py-2 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getAvatarColor(
                    index
                  )}`}
                >
                  {getInitials(item.name)}
                </div>

                <div>
                  <h3 className="text-sm font-semibold leading-5 text-slate-900">
                    {item.name}
                  </h3>

                  <p className="text-xs text-slate-500">
                    {item.role}
                  </p>
                </div>
              </div>

              <span
                className={`mr-2 rounded-full px-3 py-1 text-xs font-semibold ${getStageStyle(
                  item.stage
                )}`}
              >
                {item.stage || "Applied"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecentApplications;