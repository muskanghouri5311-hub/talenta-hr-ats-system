import { useEffect, useState } from "react";
import { getAllOffers } from "../../lib/api/offerApi";

const OfferLetters = () => {
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOffers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAllOffers();

        setOffers(response?.data?.data || []);
      } catch (error) {
        console.error("GET OFFERS ERROR:", error);

        setError(
          error?.response?.data?.message ||
            "Failed to load offer letters."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, []);

  const getStatusClasses = (status) => {
    switch (status) {
      case "Accepted":
        return "bg-emerald-50 text-emerald-600";

      case "Rejected":
        return "bg-red-50 text-red-500";

      case "Sent":
        return "bg-amber-50 text-amber-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getInitials = (name = "") => {
    return name
      .trim()
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

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
  };

  const formatSalary = (salary) => {
    if (salary === undefined || salary === null) {
      return "-";
    }

    return `PKR ${Number(salary).toLocaleString()}`;
  };

  const getCandidateName = (offer) => {
    return offer?.candidateId?.name || "Unknown Candidate";
  };

  const getCandidateRole = (offer) => {
    return offer?.candidateId?.role || "-";
  };

  const getSentThisMonth = () => {
    const now = new Date();

    return offers.filter((offer) => {
      if (!offer.sentAt) return false;

      const sentDate = new Date(offer.sentAt);

      return (
        sentDate.getMonth() === now.getMonth() &&
        sentDate.getFullYear() === now.getFullYear()
      );
    }).length;
  };

  const getAcceptanceRate = () => {
  const totalOffers = offers.length;

  if (totalOffers === 0) {
    return 0;
  }

  const acceptedOffers = offers.filter(
    (offer) => offer.status === "Accepted"
  ).length;

  return Math.round(
    (acceptedOffers / totalOffers) * 100
  );
};

  const sentThisMonth = getSentThisMonth();
  const acceptanceRate = getAcceptanceRate();

  return (
    <>
      <div className="min-h-full bg-[#f5f6fa] px-6 py-7">
        <div className="mb-5">
          <h1 className="text-[22px] font-semibold text-gray-900">
            Offer Letters
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {sentThisMonth} sent this month ·{" "}
            {acceptanceRate}% acceptance rate
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {loading ? (
            <div className="flex min-h-75 items-center justify-center">
              <div className="text-sm text-gray-500">
                Loading offer letters...
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-75 items-center justify-center px-6">
              <div className="text-center">
                <p className="text-sm font-medium text-red-500">
                  {error}
                </p>
              </div>
            </div>
          ) : offers.length === 0 ? (
            <div className="flex min-h-75 items-center justify-center px-6">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-900">
                  No offer letters yet
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Candidates will appear here once an offer
                  letter is sent.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-3 text-left text-[12px] font-medium uppercase tracking-wide text-gray-500">
                      Candidate
                    </th>

                    <th className="px-3 py-3 text-left text-[12px] font-medium uppercase tracking-wide text-gray-500">
                      Role
                    </th>

                    <th className="px-3 py-3 text-left text-[12px] font-medium uppercase tracking-wide text-gray-500">
                      Sent
                    </th>

                    <th className="px-3 py-3 text-left text-[12px] font-medium uppercase tracking-wide text-gray-500">
                      Salary
                    </th>

                    <th className="px-3 py-3 text-left text-[12px] font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-[12px] font-medium uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {offers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-8 text-center text-sm text-gray-500"
                      >
                        No Record Found
                      </td>
                    </tr>
                  )}

                  {offers.map((offer, index) => {
                    const candidateName =
                      getCandidateName(offer);

                    return (
                      <tr
                        key={offer._id}
                        className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${getAvatarColor(
                                index
                              )}`}
                            >
                              {getInitials(candidateName)}
                            </div>

                            <span className="text-sm font-semibold text-gray-900">
                              {candidateName}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <span className="text-sm text-gray-800">
                            {getCandidateRole(offer)}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span className="text-sm text-gray-800">
                            {formatDate(offer.sentAt)}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span className="font-mono text-sm text-gray-900">
                            {formatSalary(offer.salary)}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                              offer.status
                            )}`}
                          >
                            {offer.status}
                          </span>
                        </td>

                        <td className="px-6 py-3 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOffer(offer);
                              setSelectedOfferIndex(index);
                            }}
                            className="text-sm font-medium text-blue-600 transition hover:text-blue-800"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedOffer && (
        <ViewOfferModal
          offer={selectedOffer}
          avatarIndex={selectedOfferIndex}
          onClose={() => {
            setSelectedOffer(null);
            setSelectedOfferIndex(null);
          }}
        />
      )}
    </>
  );
};

const ViewOfferModal = ({
  offer,
  avatarIndex,
  onClose,
}) => {
  const candidate = offer?.candidateId || {};

  const candidateName =
    candidate?.name || "Unknown Candidate";

  const candidateEmail =
    candidate?.email || "-";

  const candidateRole =
    candidate?.role || "-";

  const getInitials = (name = "") => {
    return name
      .trim()
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

  const getStatusClasses = (status) => {
    switch (status) {
      case "Accepted":
        return "bg-emerald-50 text-emerald-600";

      case "Rejected":
        return "bg-red-50 text-red-500";

      case "Sent":
        return "bg-amber-50 text-amber-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatFullDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const formatSalary = (salary) => {
    if (salary === undefined || salary === null) {
      return "-";
    }

    return `PKR ${Number(salary).toLocaleString()}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg  font-bold text-gray-900">
              Offer Letter
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Candidate offer letter information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          <div className="mb-6 flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(
                avatarIndex
              )}`}
            >
              {getInitials(candidateName)}
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {candidateName}
              </h3>

              <p className="mt-0.5 text-sm text-gray-500">
                {candidateEmail}
              </p>
            </div>

            <span
              className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                offer.status
              )}`}
            >
              {offer.status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ReadOnlyField
              label="Candidate"
              value={candidateName}
            />

            <ReadOnlyField
              label="Role"
              value={candidateRole}
            />

            <ReadOnlyField
              label="Offer Template"
              value={offer.template}
            />

            <ReadOnlyField
              label="Salary"
              value={formatSalary(offer.salary)}
            />

            <ReadOnlyField
              label="Joining Date"
              value={formatFullDate(
                offer.joiningDate
              )}
            />

            <ReadOnlyField
              label="Probation"
              value={offer.probation}
            />

            <ReadOnlyField
              label="Sent Date"
              value={formatFullDate(offer.sentAt)}
            />

            <ReadOnlyField
              label="Email"
              value={candidateEmail}
            />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-gray-500">
              Note
            </p>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700">
              {offer.note || "No note added."}
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ReadOnlyField = ({ label, value }) => {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-gray-500">
        {label}
      </p>

      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800">
        {value || "-"}
      </div>
    </div>
  );
};

export default OfferLetters;