import { useState } from "react";
import { applyNow } from "../../lib/api/candidateApi";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "Senior Frontend Engineer",
  experience: "",
  tags: "",
  skills: "",
  resumeUrl: "",
};

function ApplyForm({ isOpen, onClose, onApplied }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.name || !form.email || !form.role) {
      setError("Name, email and role are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const candidate = await applyNow({
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      onApplied?.(candidate); // new card appears in the "Applied" column
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
          <h2 className="text-xl font-bold text-slate-900">Apply Now</h2>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-800">
            ×
          </button>
        </div>
        <div className="space-y-4 px-8 py-6">
          {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600">{error}</div>}
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
          />
          <input
            placeholder="Role applying for"
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
          />
          <input
            placeholder="Experience (e.g. 5 yrs)"
            value={form.experience}
            onChange={(e) => update("experience", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
          />
          <input
            placeholder="Tags, comma separated (e.g. React, Remote)"
            value={form.tags}
            onChange={(e) => update("tags", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
          />
          <input
            placeholder="Skills, comma separated"
            value={form.skills}
            onChange={(e) => update("skills", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
          />
          <input
            placeholder="Resume URL"
            value={form.resumeUrl}
            onChange={(e) => update("resumeUrl", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-8 py-5">
          <button onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 font-semibold text-slate-800 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApplyForm;
