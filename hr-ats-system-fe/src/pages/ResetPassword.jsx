import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import InputField from "../components/InputField";
import Button from "../components/ui/Button";
import { ResetPasswordApi } from "../lib/api/authApi";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm();

  const submit = async (data) => {
    console.log(data);

    try {
      const response = await ResetPasswordApi({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      toast.success(
        response.data.message || "Password reset successfully."
      );
      
       navigate("/login");
      reset();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to reset password."
      );
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">

      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">

        <h2 className="text-3xl font-bold mb-5">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit(submit)}>

          <InputField
            label="New Password"
            name="password"
            type="password"
            placeholder="Enter Password"
            {...register("password", {
              required: "Password is required",
            })}
          />

          {errors.password && (
            <p className="text-red-500 mb-3">
              {errors.password.message}
            </p>
          )}

          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            {...register("confirmPassword", {
              required: "Confirm Password is required",
            })}
          />

          {errors.confirmPassword && (
            <p className="text-red-500 mb-3">
              {errors.confirmPassword.message}
            </p>
          )}

          <Button
            text={isSubmitting ? "Resetting..." : "Reset Password"}
            type="submit"
          />

        </form>

        <Link to="/login">
          Back to Login
        </Link>

      </div>

    </div>
  );
}

export default ResetPassword;