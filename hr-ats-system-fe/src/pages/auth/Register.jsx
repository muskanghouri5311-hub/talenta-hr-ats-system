import { useForm } from "react-hook-form";
import { registerUser } from "../../lib/api/authApi";

import FormInput from "../../components/ui/FormInput";
import Button from "../../components/ui/Button";

const Register = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();


const password = watch("password");
const onSubmit = async (data) => {
  console.log("FORM DATA:", data);


  try {
   console.log("SENDING:", data);

  const response = await registerUser(data);  

    console.log("Register Response:", response.data);

    alert("Registration Successful");

  } catch (error) {
    
    console.error(error.response?.data || error.message);

    alert("Registration Failed");
  }
};

  return (
    <section
      className="relative flex min-h-screen w-full items-center
      justify-center bg-white px-4 py-8 sm:px-8 md:px-12 lg:h-screen lg:w-1/2 lg:px-16"
    >
      <div className="w-full max-w-lg">

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-left">
          Registration
        </h1>

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* Name */}
          <div className="mb-5">
            <span className="text-2xl flex font-semibold text-gray-900">
              Name
            </span>

            <FormInput
              type="text"
              placeholder="Enter your name"
              name="name"
              register={register}
              errors={errors}
              rules={{
                required: "Name is required",
              }}
            />
          </div>

          {/* Email */}
          <div className="mb-5">
            <span className="text-2xl flex font-semibold text-gray-900">
              Email
            </span>

            <FormInput
              type="email"
              placeholder="Enter your email"
              name="email"
              register={register}
              errors={errors}
              rules={{
                required: "Email is required",
              }}
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <span className="text-2xl flex font-semibold text-gray-900">
              Password
            </span>

            <FormInput
              type="password"
              placeholder="Enter your password"
              name="password"
              register={register}
              errors={errors}
              rules={{
                required: "Password is required",
              }}
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-5">
            <span className="text-2xl flex font-semibold text-gray-900">
              Confirm Password
            </span>

            <FormInput
              type="password"
              placeholder="Confirm your password"
              name="confirmPassword"
              register={register}
              errors={errors}
              rules={{
                required: "Confirm Password is required",
                validate: (value) =>
                  value === password || "Passwords do not match",
              }}
            />
          </div>

          <Button
            type="submit"
            text="Register"
          />

        </form>
      </div>
    </section>
  );
};

export default Register;