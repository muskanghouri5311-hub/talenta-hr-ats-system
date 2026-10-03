import { useForm } from "react-hook-form";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";

import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import { UpdatePasswordApi } from "../lib/api/authApi";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const { newPassword, confirmPassword } = data;

    // Check passwords match
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await UpdatePasswordApi({
        token,
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        toast.success(
          "Password updated successfully. Please login again."
        );

        navigate("/login");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update password"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">

        <h2 className="text-3xl font-bold text-center mb-2">
          Update Password
        </h2>

        <p className="text-center text-gray-500 mb-6">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* New Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password{" "}
              <span className="text-red-500">*</span>
            </label>

            <FormInput
              type="password"
              placeholder="New Password"
              register={register}
              name="newPassword"
              errors={errors}
              rules={{
                required: "New password is required",
                pattern: {
                  value:
                    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
                  message:
                    "Password must be at least 8 characters long and contain at least one letter, one number, and one special character.",
                },
              }}
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password{" "}
              <span className="text-red-500">*</span>
            </label>

            <FormInput
              type="password"
              placeholder="Confirm Password"
              register={register}
              name="confirmPassword"
              errors={errors}
              rules={{
                required: "Confirm password is required",
              }}
            />
          </div>

          {/* Update Button */}
          <Button
            className="mt-2 w-full"
            type="submit"
            text="Update Password"
          />

        </form>

        {/* Back to Login */}
        <p className="text-center mt-5">
          Back to{" "}
          <Link
            to="/login"
            className="text-purple-700 font-semibold"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
};

export default UpdatePassword;