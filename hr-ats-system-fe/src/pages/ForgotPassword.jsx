import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";

import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import { ForgotPasswordApi } from "../lib/api/authApi";

const ForgotPassword = () => {
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
  // Prevent multiple API requests
  if (isSubmitting || emailSent) return;

  try {
    const response = await ForgotPasswordApi(data);

    console.log(
      "Forgot Password Response:",
      response.data
    );

    if (response.data.success) {
      // Mark as sent immediately
      setEmailSent(true);

      toast.success(
        response.data.message ||
          "Password reset link sent. Please check your email."
      );

      reset();
    }
  } catch (error) {
    console.error(
      error.response?.data || error.message
    );

    toast.error(
      error.response?.data?.message ||
        "Failed to send reset link"
    );
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6">
          Forgot Password
        </h2>

        {!emailSent ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              type="email"
              placeholder="Enter Email"
              register={register}
              name="email"
              errors={errors}
            />

            <Button
              type="submit"
              className="mt-5 w-full"
              text={isSubmitting ? "Sending..." : "Send Reset Link"}
              disabled={isSubmitting}
            />
          </form>
        ) : (
          <div className="rounded-lg border border-green-500 bg-green-100 p-5 text-center">
            <div className="text-5xl mb-3">✅</div>

            <h3 className="text-xl font-bold text-green-700">
              Email Sent Successfully
            </h3>
          </div>
        )}

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

export default ForgotPassword;