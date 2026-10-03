
import ScoreCircle from "./ScoreCircle";

function CandidateCard({
  candidate,
  onMoveOffer,
  onViewResume,
  onViewCandidate,
  showViewCandidate = true,
}) {
  const skills = candidate.skills || [];

  const offerAlreadySent =
    candidate?.stage === "Offer Sent" ||
    candidate?.stage === "Hired" ||
    candidate?.offer?.status === "Sent" ||
    candidate?.offer?.status === "Accepted";

  // INTERVIEW PASSED CHECK
  const interviewPassed = candidate?.interviewPassed === true;

  // REJECTED CHECK
  const candidateRejected =
    candidate?.stage === "Rejected" ||
    candidate?.status === "Rejected";

  const handleOfferClick = (e) => {
    e.stopPropagation();

    // Rejected candidate cannot move to offer
    if (candidateRejected) {
      return;
    }

    // Interview must be passed before moving to offer
    if (!interviewPassed) {
      return;
    }

    onMoveOffer();
  };

  const handleViewCandidateClick = (e) => {
    e.stopPropagation();

    if (onViewCandidate) {
      onViewCandidate(candidate);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-10 py-5">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-8">
        <h2 className="w-3 font-bold text-slate-400">
          {candidate.rank}
        </h2>

        <ScoreCircle
          score={candidate.score}
          color={candidate.color}
        />

        <div>
          <h3 className="text-1xl font-bold text-slate-700 text-left">
            {candidate.name}
          </h3>

          <p className="text-sm text-slate-500 text-left">
            {candidate.experience} • {candidate.role}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="rounded-md bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-600"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex gap-4">

        {/* VIEW CANDIDATE */}
        {showViewCandidate && (
          <button
            type="button"
            onClick={handleViewCandidateClick}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-bold text-slate-700 hover:bg-slate-50"
          >
            View Candidate
          </button>
        )}

        {/* VIEW RESUME */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewResume();
          }}
          className="rounded-xl border border-slate-300 bg-white px-2 py-1 font-bold"
        >
          View Resume
        </button>

        {/* MOVE TO OFFER / REJECTED */}
        <button
          type="button"
          onClick={handleOfferClick}
          disabled={
            !interviewPassed ||
            offerAlreadySent ||
            candidateRejected
          }
          className={`rounded-xl px-6 py-3 font-semibold text-white ${
            candidateRejected ||
            offerAlreadySent ||
            !interviewPassed
              ? "cursor-not-allowed bg-slate-400 opacity-70"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {candidateRejected
            ? "Rejected"
            : offerAlreadySent
            ? "Offer Sent"
            : "Move to Offer"}
        </button>
      </div>
    </div>
  );
}

export default CandidateCard;
