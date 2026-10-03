function StatCard({
  title,
  value,
  subtitle,
  subtitleColor = "text-emerald-600",
  showProgress = false,
}) {
  return (
    <div className="min-h-22.5 rounded-2xl border-slate-200 bg-white px-5 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <div>
          <h2 className="text-[30px] font-bold leading-none text-slate-900">
            {value}
          </h2>

          {subtitle && (
            <p
              className={`mt-3 text-xs font-semibold ${subtitleColor}`}
            >
              {subtitle}
            </p>
          )}
        </div>

        {showProgress && (
          <div className="relative flex h-13 w-13 items-center justify-center rounded-full border-[6px] border-emerald-600">
            <span className="text-xs font-bold text-slate-900">
              {value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;