import { X } from "lucide-react";

const RequisitionDetailsModal = ({
  isOpen,
  requisition,
  onClose,
}) => {
  if (!isOpen || !requisition) return null;

  const status =
    requisition.status === "Open"
      ? "Published"
      : requisition.status;

  const deadline = requisition.deadline
    ? new Date(requisition.deadline).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "Not set";

  const salaryMin = Number(
    requisition.salaryMin || 0
  ).toLocaleString();

  const salaryMax = Number(
    requisition.salaryMax || 0
  ).toLocaleString();

  const skills = Array.isArray(requisition.skills)
    ? requisition.skills
    : requisition.skills
      ? requisition.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

      <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white text-slate-900">

        {/* ================= HEADER ================= */}

        <div className="border-b border-gray-200 px-7 py-6">

          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-gray-500 hover:text-gray-900"
          >
            <X size={26} />
          </button>

          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {status}
          </span>

          <h2 className="mt-3 text-3xl font-semibold text-slate-900">
            {requisition.role || "Untitled"}
          </h2>

          <p className="mt-2 text-gray-500">
            {requisition.department || "Not set"}
            {" · "}
            {requisition.location || "Not set"}
          </p>

        </div>

        {/* ================= BASIC DETAILS ================= */}

        <section className="border-b border-gray-200 px-7 py-6">

          <h3 className="mb-5 text-xs font-medium uppercase tracking-wider text-gray-500">
            Basic Details
          </h3>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6">

            <Detail
              label="Job Title"
              value={requisition.role}
            />

            <Detail
              label="Department"
              value={requisition.department}
            />

            <Detail
              label="Employment Type"
              value={
                requisition.type ||
                requisition.employmentType
              }
            />

            <Detail
              label="Location"
              value={requisition.location}
            />

            <Detail
              label="Number of Openings"
              value={requisition.openings}
            />

            <Detail
              label="Experience Level"
              value={requisition.experienceLevel}
            />

            <Detail
              label="Application Deadline"
              value={deadline}
            />

          </div>

        </section>

        {/* ================= COMPENSATION ================= */}

        <section className="border-b border-gray-200 px-7 py-6">

          <h3 className="mb-5 text-xs font-medium uppercase tracking-wider text-gray-500">
            Compensation
          </h3>

          <div className="grid grid-cols-2 gap-5">

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-xs text-gray-500">
                Salary Range — Min (PKR)
              </p>

              <p className="mt-2 text-xl font-semibold text-slate-900">
                Rs {salaryMin}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-xs text-gray-500">
                Salary Range — Max (PKR)
              </p>

              <p className="mt-2 text-xl font-semibold text-slate-900">
                Rs {salaryMax}
              </p>
            </div>

          </div>

        </section>

        {/* ================= DESCRIPTION ================= */}

        <section className="border-b border-gray-200 px-7 py-6">

          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-500">
            Description
          </h3>

          <p className="whitespace-pre-wrap text-base leading-7 text-slate-700">
            {requisition.description || "Not set"}
          </p>

        </section>

        {/* ================= REQUIREMENTS ================= */}

        <section className="border-b border-gray-200 px-7 py-6">

          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-500">
            Requirements / Must-have Skills
          </h3>

          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-base leading-7 text-slate-700">
              {requisition.requirements || "Not set"}
            </p>
          )}

        </section>

        {/* ================= FOOTER ================= */}

        <div className="flex justify-end px-7 py-5">

          <button
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-gray-100"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
};


/* Reusable field component */
const Detail = ({ label, value }) => {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-slate-900">
        {value !== undefined &&
        value !== null &&
        value !== ""
          ? value
          : "Not set"}
      </p>
    </div>
  );
};

export default RequisitionDetailsModal;