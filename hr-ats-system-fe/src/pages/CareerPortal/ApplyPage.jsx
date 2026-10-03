import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";

import ApplicationSuccess from "./ApplicationSuccess";

import { getPublicRequisitionById } from "../../lib/api/requisitionApi";
import { applyNow } from "../../lib/api/candidateApi";

const inputBase =
  "h-11 w-full rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 outline-none placeholder:text-slate-400 transition focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const formatSalary = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value).toLocaleString("en-US");
};

const formatDeadline = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  experience: "",
  resume: null,
  coverNote: "",
  currentSalary: "",
  expectedSalary: "",
  noticePeriod: "Immediate",
  currentCity: "",
  willingToRelocate: "Yes",
};

const ApplyPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // =====================================================
  // LOAD JOB BY ID
  // =====================================================

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response =
          await getPublicRequisitionById(jobId);

        const jobData = response?.data?.data;

        if (!jobData) {
          setLoadError("This job could not be found.");
          return;
        }

        setJob(jobData);
      } catch (error) {
        console.error(
          "FAILED TO FETCH JOB:",
          error?.response?.data || error
        );

        setLoadError(
          error?.response?.data?.message ||
            "This job could not be found or is no longer open."
        );
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  // =====================================================
  // FORM HANDLERS
  // =====================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));

      return;
    }

    if (name === "name") {
      const cleanedValue = value
        .replace(/[^A-Za-z\s]/g, "")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      setForm((prev) => ({
        ...prev,
        name: cleanedValue,
      }));

      return;
    }

    if (name === "phone") {
      const cleanedValue = value.replace(/\D/g, "");

      setForm((prev) => ({
        ...prev,
        phone: cleanedValue,
      }));

      return;
    }

    if (name === "experience") {
      const cleanedValue = value.replace(/\D/g, "");

      setForm((prev) => ({
        ...prev,
        experience: cleanedValue,
      }));

      return;
    }

    if (name === "currentSalary" || name === "expectedSalary") {
      const cleanedValue = value.replace(/\D/g, "");

      setForm((prev) => ({
        ...prev,
        [name]: cleanedValue,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF resume is allowed.");
      e.target.value = "";

      setForm((prev) => ({
        ...prev,
        resume: null,
      }));

      return;
    }

    if (file.size > 7 * 1024 * 1024) {
      toast.error("Resume size must be less than 7MB.");
      e.target.value = "";

      setForm((prev) => ({
        ...prev,
        resume: null,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      resume: file,
    }));
  };

  const handleRemoveResume = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setForm((prev) => ({
      ...prev,
      resume: null,
    }));
  };

  const clearOnlyField = (field) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === "resume" ? null : "",
    }));
  };

  // =====================================================
  // SUBMIT APPLICATION
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requisitionId = job._id || job.id;

    if (!requisitionId) {
      toast.error("Job ID not found.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }

    if (!form.resume) {
      toast.error("Please upload your resume.");
      return;
    }

    try {
      setSubmitting(true);

      await applyNow({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        experience: form.experience.trim(),
        coverNote: form.coverNote.trim(),
        resume: form.resume,
        role: job.role,
        requisitionId,
        currentSalary: form.currentSalary.trim(),
        expectedSalary: form.expectedSalary.trim(),
        noticePeriod: form.noticePeriod,
        currentCity: form.currentCity.trim(),
        willingToRelocate: form.willingToRelocate === "Yes",
      });

      setForm(INITIAL_FORM);
      setShowSuccess(true);
    } catch (error) {
      console.error(
        "APPLICATION ERROR:",
        error?.response?.data || error
      );

      const responseData = error?.response?.data;
      const message =
        responseData?.message ||
        responseData?.error ||
        error?.message ||
        "Application submission failed.";

      const normalizedMessage = String(message).toLowerCase();

      if (
        normalizedMessage.includes("email") &&
        (normalizedMessage.includes("already") ||
          normalizedMessage.includes("exist") ||
          normalizedMessage.includes("duplicate"))
      ) {
        clearOnlyField("email");
        toast.error("This email already exists. Please use another email.");
        return;
      }

      if (
        normalizedMessage.includes("phone") &&
        (normalizedMessage.includes("already") ||
          normalizedMessage.includes("exist") ||
          normalizedMessage.includes("duplicate"))
      ) {
        clearOnlyField("phone");
        toast.error("This phone number already exists. Please use another phone number.");
        return;
      }

      if (
        normalizedMessage.includes("resume") ||
        normalizedMessage.includes("cv")
      ) {
        clearOnlyField("resume");
        toast.error(message);
        return;
      }

      if (normalizedMessage.includes("name")) {
        clearOnlyField("name");
        toast.error(message);
        return;
      }

      if (
        normalizedMessage.includes("experience") ||
        normalizedMessage.includes("years")
      ) {
        clearOnlyField("experience");
        toast.error(message);
        return;
      }

      if (
        normalizedMessage.includes("cover") ||
        normalizedMessage.includes("note")
      ) {
        clearOnlyField("coverNote");
        toast.error(message);
        return;
      }

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate("/career-portal");
  };

  // =====================================================
  // UI
  // =====================================================

  const salaryMin = formatSalary(job?.salaryMin);
  const salaryMax = formatSalary(job?.salaryMax);
  const deadlineLabel = formatDeadline(job?.deadline);

  const requirementLines = (job?.requirements || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F5F6FA] font-sans">
      <section className="bg-[#101118] text-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#315FEA] to-[#7351D8] text-[16px] font-bold">
              T
            </div>

            <span className="text-[19px] font-bold">
              Talenta Careers
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <button
          type="button"
          onClick={() => navigate("/career-portal")}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#315FEA] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to open roles
        </button>

        {loading && (
          <div className="rounded-2xl border border-[#E1E4EB] bg-white px-8 py-20 text-center shadow-sm">
            <p className="text-sm text-[#64748B]">
              Loading job details...
            </p>
          </div>
        )}

        {!loading && loadError && (
          <div className="rounded-2xl border border-[#E1E4EB] bg-white px-8 py-20 text-center shadow-sm">
            <h2 className="text-[17px] font-bold text-[#111827]">
              Job not available
            </h2>

            <p className="mt-1 text-[13px] text-[#64748B]">
              {loadError}
            </p>
          </div>
        )}

        {!loading && !loadError && job && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
            {/* =====================================================
                JOB SUMMARY SIDEBAR
            ===================================================== */}

            <aside className="order-1 lg:sticky lg:top-8 lg:order-2 lg:col-span-1">
              <div className="overflow-hidden rounded-2xl border border-[#E1E4EB] bg-white shadow-sm">
                <div className="border-b border-[#E1E4EB] bg-linear-to-br from-[#101118] to-[#1E2233] px-6 py-6 text-white">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                    <Briefcase className="h-5 w-5" />
                  </div>

                  <h1 className="mt-4 text-[19px] font-bold leading-tight">
                    {job.role}
                  </h1>

                  <p className="mt-1 text-[13px] text-white/60">
                    {job.department}
                  </p>
                </div>

                <div className="space-y-4 px-6 py-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-600">
                      <Building2 className="h-3.5 w-3.5" />
                      {job.department}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-600">
                      <Clock className="h-3.5 w-3.5" />
                      {job.type}
                    </span>

                    {job.location && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-600">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                    )}
                  </div>

                  {(salaryMin || salaryMax) && (
                    <div className="flex items-center gap-3 rounded-xl bg-[#EEF2FF] px-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#315FEA]">
                        <DollarSign className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5B6FD6]">
                          Salary Range
                        </p>
                        <p className="text-[14px] font-bold text-[#111827]">
                          PKR {salaryMin || "—"}
                          {" – "}
                          {salaryMax || "—"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 border-t border-[#E1E4EB] pt-4">
                    {job.experienceLevel && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <Briefcase className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="text-slate-500">Experience Level</span>
                        <span className="ml-auto font-semibold text-slate-800">
                          {job.experienceLevel}
                          {job.minExperienceYears != null
                            ? ` (${job.minExperienceYears}+ yrs)`
                            : ""}
                        </span>
                      </div>
                    )}

                    {job.education && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="text-slate-500">Education</span>
                        <span className="ml-auto font-semibold text-slate-800">
                          {job.education}
                        </span>
                      </div>
                    )}

                    {job.openings != null && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <Users className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="text-slate-500">Openings</span>
                        <span className="ml-auto font-semibold text-slate-800">
                          {job.openings}
                        </span>
                      </div>
                    )}

                    {deadlineLabel && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="text-slate-500">Apply Before</span>
                        <span className="ml-auto font-semibold text-slate-800">
                          {deadlineLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  {job.description && (
                    <div className="border-t border-[#E1E4EB] pt-4">
                      <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
                        About the Role
                      </h3>
                      <p className="mt-2 whitespace-pre-line text-[13px] leading-5 text-slate-600">
                        {job.description}
                      </p>
                    </div>
                  )}

                  {requirementLines.length > 0 && (
                    <div className="border-t border-[#E1E4EB] pt-4">
                      <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
                        Requirements
                      </h3>
                      <ul className="mt-2 space-y-1.5">
                        {requirementLines.map((line, index) => (
                          <li
                            key={index}
                            className="flex gap-2 text-[13px] leading-5 text-slate-600"
                          >
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* =====================================================
                APPLICATION FORM
            ===================================================== */}

            <div className="order-2 lg:order-1 lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-[#E1E4EB] bg-white shadow-sm">
                <div className="border-b border-[#E1E4EB] px-7 py-5">
                  <h2 className="text-[18px] font-bold leading-6 text-[#111827]">
                    Application Form
                  </h2>
                  <p className="mt-0.5 text-[13px] leading-5 text-[#64748B]">
                    Fields marked with{" "}
                    <span className="text-red-500">*</span> are required.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="px-7 py-6">
                  {/* PERSONAL INFORMATION */}
                  <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
                    Personal Information
                  </h3>

                  <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827]">
                        Full Name <span className="ml-1 text-red-500">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          required
                          minLength={3}
                          pattern="[A-Za-z\s]+"
                          title="Name should contain characters only."
                          disabled={submitting}
                          className={`${inputBase} pl-10`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827]">
                        Email <span className="ml-1 text-red-500">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@email.com"
                          required
                          disabled={submitting}
                          className={`${inputBase} pl-10`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827]">
                        Phone
                      </label>
                      <div className="relative mt-1.5">
                        <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="03001234567"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          title="Phone number should contain numbers only."
                          disabled={submitting}
                          className={`${inputBase} pl-10`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827]">
                        Current Resident City
                      </label>
                      <div className="relative mt-1.5">
                        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          name="currentCity"
                          value={form.currentCity}
                          onChange={handleChange}
                          placeholder="e.g. Lahore"
                          disabled={submitting}
                          className={`${inputBase} pl-10`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* PROFESSIONAL DETAILS */}
                  <h3 className="mt-7 text-[12px] font-bold uppercase tracking-wide text-slate-500">
                    Professional Details
                  </h3>

                  <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827]">
                        Years of Experience
                      </label>
                      <input
                        type="text"
                        name="experience"
                        value={form.experience}
                        onChange={handleChange}
                        placeholder="5"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        title="Experience should contain numbers only."
                        disabled={submitting}
                        className={`${inputBase} mt-1.5 px-3.5`}
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827]">
                        Notice Period
                      </label>
                      <select
                        name="noticePeriod"
                        value={form.noticePeriod}
                        onChange={handleChange}
                        disabled={submitting}
                        className={`${inputBase} mt-1.5 px-3.5`}
                      >
                        <option value="Immediate">Immediate</option>
                        <option value="15 Days">15 Days</option>
                        <option value="1 Month">1 Month</option>
                        <option value="2 Months">2 Months</option>
                        <option value="More than 2 Months">More than 2 Months</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827]">
                        Current Salary (PKR)
                      </label>
                      <div className="relative mt-1.5">
                        <DollarSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          name="currentSalary"
                          value={form.currentSalary}
                          onChange={handleChange}
                          placeholder="e.g. 80000"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          title="Current salary should contain numbers only."
                          disabled={submitting}
                          className={`${inputBase} pl-10`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827]">
                        Expected Salary (PKR)
                      </label>
                      <div className="relative mt-1.5">
                        <DollarSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          name="expectedSalary"
                          value={form.expectedSalary}
                          onChange={handleChange}
                          placeholder="e.g. 100000"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          title="Expected salary should contain numbers only."
                          disabled={submitting}
                          className={`${inputBase} pl-10`}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[13px] font-semibold text-[#111827]">
                        Willing for onsite role / willing to relocate to Lahore
                      </label>
                      <select
                        name="willingToRelocate"
                        value={form.willingToRelocate}
                        onChange={handleChange}
                        disabled={submitting}
                        className={`${inputBase} mt-1.5 px-3.5 sm:w-1/2`}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  {/* RESUME & COVER NOTE */}
                  <h3 className="mt-7 text-[12px] font-bold uppercase tracking-wide text-slate-500">
                    Resume &amp; Cover Note
                  </h3>

                  <div className="mt-3">
                    <label className="block text-[13px] font-semibold text-[#111827]">
                      Resume / CV <span className="ml-1 text-red-500">*</span>
                    </label>

                    {!form.resume ? (
                      <label
                        htmlFor="resume-upload"
                        className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center transition hover:border-[#315FEA] hover:bg-[#F5F7FF] ${
                          submitting ? "pointer-events-none opacity-60" : ""
                        }`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF] text-[#315FEA]">
                          <Upload className="h-5 w-5" />
                        </div>
                        <p className="text-[13px] font-semibold text-slate-700">
                          Click to upload your resume
                        </p>
                        <p className="text-[11px] text-slate-400">
                          PDF only · Maximum 7MB
                        </p>
                      </label>
                    ) : (
                      <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#315FEA]">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-700">
                          {form.resume.name}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveResume}
                          disabled={submitting}
                          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
                          aria-label="Remove resume"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <input
                      id="resume-upload"
                      ref={fileInputRef}
                      type="file"
                      name="resume"
                      accept="application/pdf,.pdf"
                      onChange={handleResumeChange}
                      required={!form.resume}
                      disabled={submitting}
                      className="hidden"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-[13px] font-semibold text-[#111827]">
                      Cover Note (optional)
                    </label>
                    <textarea
                      rows={4}
                      name="coverNote"
                      value={form.coverNote}
                      onChange={handleChange}
                      placeholder="Why are you a great fit for this role?"
                      disabled={submitting}
                      className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10 disabled:bg-slate-50"
                    />
                  </div>

                  <div className="mt-7 flex flex-col-reverse justify-end gap-2.5 border-t border-[#E1E4EB] pt-5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => navigate("/career-portal")}
                      disabled={submitting}
                      className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-[14px] font-semibold text-[#111827] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="h-11 rounded-xl bg-[#315FEA] px-6 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#2853D5] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Submitting..." : "Submit Application"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {showSuccess && (
        <ApplicationSuccess
          job={job}
          onClose={handleSuccessClose}
        />
      )}
    </div>
  );
};

export default ApplyPage;
