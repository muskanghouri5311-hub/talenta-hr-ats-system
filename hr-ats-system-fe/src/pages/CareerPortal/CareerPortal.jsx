import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {getPublicOpenRequisitions,} from "../../lib/api/requisitionApi";

const CareerPortal = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchJobs = async () => {
    try {
      setLoading(true);

      const response =
        await getPublicOpenRequisitions();

      console.log("OPEN JOBS:", response?.data);

      const allJobs =
        response?.data?.data || [];

      const availableJobs = allJobs.filter((job) => {
        const hasOpenings =
          job.candidates < job.openings;

        const deadlineNotPassed =
          !job.deadline ||
          new Date(job.deadline) >= new Date();

        return hasOpenings && deadlineNotPassed;
      });

      setJobs(availableJobs);
    } catch (error) {
      console.error(
        "FAILED TO FETCH OPEN JOBS:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
        "Failed to load open jobs"
      );
    } finally {
      setLoading(false);
    }
  };

  fetchJobs();
}, []);
  return (
    <div className="min-h-screen bg-[#F5F6FA] font-sans">
      <section className="bg-[#101118] text-white">
        <div className="mx-auto max-w-285 px-6 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-8.75
                  w-8.75
                  items-center
                  justify-center
                  rounded-xl
                  bg-linear-to-br
                  from-[#315FEA]
                  to-[#7351D8]
                  text-[16px]
                  font-bold
                "
              >
                T
              </div>

              <span className="text-[25px] font-bold">
                Talenta Careers
              </span>
            </div>

            <span
              className="
                shrink-0
                rounded-xl
                border
                border-[#DDE2EA]
                bg-white
                px-3
                py-1
                text-[13px]
                font-semibold
                text-[#111827]
              "
            >
              Career Portal (public)
            </span>
          </div>

          <div className="pb-15 pt-8.75">
            <h1
              className="
                max-w-180
                text-[35px]
                font-bold
                leading-tight
              "
            >
              Build what’s next, with a team that
              <br />
              hires on purpose.
            </h1>

            <p
              className="
                mt-2
                text-[13px]
                text-[#AAB4C8]
              "
            >
              Browse open roles and apply in minutes
              — no account required.
            </p>
          </div>
        </div>
      </section>

      <main
        className="
          relative
          z-10
          mx-auto
          -mt-9.5
          max-w-262.5
          px-6
          pb-16
        "
      >
        <div
          className="
            overflow-hidden
            rounded-[22px]
            border
            border-[#E1E4EB]
            bg-white
            shadow-sm
          "
        >
          {loading && (
            <div className="px-8 py-10 text-center">
              <p className="text-sm text-[#64748B]">
                Loading available jobs...
              </p>
            </div>
          )}

          {!loading && jobs.length === 0 && (
            <div className="px-8 py-12 text-center">
              <h2 className="text-[17px] font-bold text-[#111827]">
                No open positions
              </h2>

              <p className="mt-1 text-[13px] text-[#64748B]">
                There are currently no open jobs available.
              </p>
            </div>
          )}

          {!loading &&
            jobs.length > 0 &&
            jobs.map((job, index) => (
              <div
                key={job._id || job.id || job.role}
                className={`
                  flex
                  flex-col
                  gap-3
                  px-6
                  py-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  sm:px-8
                  ${index !== jobs.length - 1
                    ? "border-b border-[#E5E7EB]"
                    : ""
                  }
                `}
              >
                <div className="min-w-0">
                  <h2
                    className="
                      text-[16px]
                      font-bold
                      text-[#111827]
                    "
                  >
                    {job.role}
                  </h2>

                  <p
                    className="
                      mt-1
                      text-[13px]
                      text-[#64748B]
                    "
                  >
                    {job.department}
                    {" · "}
                    {job.type}
                    {" · "}
                    {job.location}
                    {" · PKR "}
                    {job.salaryMin}
                    {"–"}
                    {job.salaryMax}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/apply/${job._id || job.id}`)
                  }
                  className="
                    self-start
                    shrink-0
                    rounded-xl
                    bg-[#315FEA]
                    px-3
                    py-1
                    text-[13px]
                    font-semibold
                    text-white
                    transition
                    hover:bg-[#2853D5]
                    sm:ml-6
                    sm:self-auto
                  "
                >
                  Apply Now
                </button>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
};

export default CareerPortal;