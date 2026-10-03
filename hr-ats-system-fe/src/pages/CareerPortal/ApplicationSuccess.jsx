const ApplicationSuccess = ({ job,  onClose }) => {
    if (!job) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-4">

      <div className="w-full max-w-157.5 rounded-[22px] bg-white shadow-xl">

        {/* CONTENT */}
        <div className="px-8 py-12 text-center">

          {/* CHECK */}
          <div
            className="
              mx-auto
              flex
              h-21
              w-21
              items-center
              justify-center
              rounded-full
              bg-[#E2F7F0]
            "
          >
            <span className="text-[48px] font-light text-[#159B76]">
              ✓
            </span>
          </div>

          {/* TITLE */}
          <h2 className="mt-7 text-[28px] font-bold text-[#181B25]">
            Application received
          </h2>

          {/* MESSAGE */}
          <p className="mx-auto mt-3 max-w-135 text-[18px] leading-[1.4] text-[#64748B]">
           Thanks for applying to {job.role}. Our team
will review your resume and reach out within 5–7 business
days.
          </p>

        </div>

        {/* FOOTER */}
        <div className="flex justify-center border-t border-[#E5E7EB] px-8 py-6">

          <button
            onClick={onClose}
            className="
              rounded-xl
              bg-[#315FEA]
              px-7
              py-3
              text-[16px]
              font-semibold
              text-white
              transition
              hover:bg-[#2853D5]
            "
          >
            Done
          </button>

        </div>

      </div>

    </div>
  );
};

export default ApplicationSuccess;