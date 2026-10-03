const funnelConfig = [
  {
    key: "applied",
    title: "Applied",
    color: "bg-indigo-500",
  },
  {
    key: "screening",
    title: "Screening",
    color: "bg-indigo-500",
  },
  {
    key: "shortlisted",
    title: "Shortlisted",
    color: "bg-indigo-500",
  },
  {
    key: "interview",
    title: "Interview",
    color: "bg-indigo-500",
  },
  {
    key: "offer",
    title: "Offer",
    color: "bg-indigo-500",
  },
  {
    key: "hired",
    title: "Hired",
    color: "bg-emerald-500",
  },
];

function HiringFunnel({ data = {} }) {
  const values = funnelConfig.map(
    (item) => ({
      ...item,
      value: data[item.key] || 0,
    })
  );

  const maxValue = Math.max(
    ...values.map((item) => item.value),
    1
  );

  return (
    <div className="h-full rounded-2xl border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">
        Hiring funnel
      </h2>

      <div className="space-y-3">
        {values.map((item) => {
          const width =
            item.value === 0
              ? 0
              : (item.value / maxValue) * 100;

          return (
            <div
              key={item.title}
              className="grid grid-cols-[115px_1fr_35px] items-center gap-3"
            >
              <p className="text-sm text-slate-600">
                {item.title}
              </p>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{
                    width: `${width}%`,
                  }}
                />
              </div>

              <p className="text-right text-sm font-semibold text-slate-900">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HiringFunnel;