function ScoreCircle({ score = 0, color = "#2563eb" }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-15 w-15 items-center justify-center">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="35"
          cy="35"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-lg font-bold text-slate-800">{score}</span>
    </div>
  );
}

export default ScoreCircle;