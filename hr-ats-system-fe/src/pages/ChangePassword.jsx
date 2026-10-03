import { useState } from "react";
import { toast } from "sonner";
import InputField from "../components/InputField";
import Button from "../components/ui/Button";
import { changePassword } from "../lib/api/authApi";

function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // =====================================================
  // Phase 4 fix: this used to be a fully mock form —
  // handleSubmit never called any API, it just showed an
  // alert(). It now calls the real
  // POST /auth/change-password endpoint (which already
  // existed on the backend, unused) and uses toast for
  // feedback like the rest of the app.
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword || !formData.newPassword) {
      toast.error("Current and new password are required.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New password and confirm password must match.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast.success(
        response?.data?.message || "Password changed successfully."
      );

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to change password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8 lg:p-10">
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-500">Security</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Change Password</h2>
          <p className="mt-2 text-sm text-slate-600">Update your password to keep your account secure.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Current Password"
            name="currentPassword"
            type="password"
            placeholder="Enter current password"
            value={formData.currentPassword}
            onChange={handleChange}
          />

          <InputField
            label="New Password"
            name="newPassword"
            type="password"
            placeholder="Enter new password"
            value={formData.newPassword}
            onChange={handleChange}
          />

          <InputField
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter new password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <Button
            text={submitting ? "Updating..." : "Update Password"}
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;