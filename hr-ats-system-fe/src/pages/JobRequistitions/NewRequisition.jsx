
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import Modal from "../../components/ui/Modal";
import FormInput from "../../components/ui/FormInput";
import Button from "../../components/ui/Button";
import {
  createRequisition,
  updateRequisition,
} from "../../lib/api/requisitionApi";
import {
  getEmploymentTypesLookup,
  getDepartmentLookup,
} from "../../lib/api/authdepApi";

const NewRequisition = ({
  isOpen,
  onClose,
  onSaved,
  requisition,
  isCreateMode,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      jobTitle: "",
      department: "",
      employmentType: "",
      location: "",
      openings: 0,
      experienceLevel: "",
      deadline: "",
      salaryMin: "",
      salaryMax: "",
      description: "",
      requirements: "",
      publishOption: "draft",
    },
  });

  const publishOption = watch("publishOption");
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    getEmploymentTypesLookup()
      .then((res) => setEmploymentTypes(res.data.data))
      .catch((error) =>
        console.log("Failed to load employment types:", error)
      );

    getDepartmentLookup()
      .then((res) => setDepartments(res.data.data || []))
      .catch((error) => {
        console.log("Failed to load departments:", error);
        toast.error(
          error?.response?.data?.message ||
            "Failed to load departments"
        );
      });
  }, []);

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  useEffect(() => {
    if (isCreateMode) {
      reset({
        jobTitle: "",
        department: "",
        employmentType: "",
        location: "",
        openings: 0,
        experienceLevel: "",
        deadline: "",
        salaryMin: "",
        salaryMax: "",
        description: "",
        requirements: "",
        publishOption: "draft",
      });
      return;
    }

    if (requisition) {
      reset({
        jobTitle: requisition.role || "",
        department: requisition.department || "",
        employmentType: requisition.type || "",
        location: requisition.location || "",
        openings: requisition.openings || 1,
        experienceLevel: requisition.experienceLevel || "",
        deadline: requisition.deadline
          ? requisition.deadline.split("T")[0]
          : "",
        salaryMin: requisition.salaryMin || "",
        salaryMax: requisition.salaryMax || "",
        description: requisition.description || "",
        requirements: requisition.requirements || "",
        publishOption:
          requisition.status === "Open" ? "publish" : "draft",
      });
    }
  }, [isCreateMode, requisition, reset]);

  const onSubmit = async (data) => {
    const finaldata = {
      role: data.jobTitle,
      department: data.department,
      type: data.employmentType,
      location: data.location,
      openings: data.openings,
      experienceLevel: data.experienceLevel,
      deadline: data.deadline,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      description: data.description,
      requirements: data.requirements,
      status:
        data.publishOption === "publish"
          ? "Open"
          : "Draft",
    };

    try {
      let response;

      if (requisition) {
        response = await updateRequisition(
          requisition._id,
          finaldata
        );
      } else {
        response = await createRequisition(finaldata);
      }

      console.log(
        "Requisition saved:",
        response.data
      );

      if (onSaved) {
        onSaved(response.data.data);
      }

      onClose();

      toast.success(
        requisition
          ? "Job requisition updated successfully"
          : "Job requisition created successfully"
      );
    } catch (error) {
      console.log("Full Error:", error);
      console.log("Response:", error.response);
      console.log("Data:", error.response?.data);
      console.log("Status:", error.response?.status);

      toast.error(
        error.response?.data?.message ||
          "Failed to save requisition"
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        requisition
          ? "Edit Job Requisition"
          : "Create Job Requisition"
      }
      subtitle="Fill in role details, then publish or save as draft"
      size="max-w-3xl"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <p className="text-xs font-semibold uppercase text-gray-500">
          Basic Details
        </p>

        <div>
          <label className="flex text-sm font-semibold text-gray-800">
            Job Title{" "}
            <span className="text-red-500 ml-1">
              *
            </span>
          </label>

          <FormInput
            type="text"
            placeholder="e.g. Senior Frontend Engineer"
            name="jobTitle"
            register={register}
            errors={errors}
            rules={{
              required: "Job title is required",
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex text-sm font-semibold text-gray-800">
              Department{" "}
              <span className="text-red-500 ml-1">
                *
              </span>
            </label>

            <select
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              {...register("department", {
                required: "Department is required",
              })}
            >
              <option value="" disabled>
                Select Department
              </option>

              {departments.map((department) => (
                <option
                  key={department.id}
                  value={department.name}
                >
                  {department.name}
                </option>
              ))}
            </select>

            {errors.department && (
              <p className="mt-1 text-xs text-red-500">
                {errors.department.message}
              </p>
            )}
          </div>

          <div>
            <label className="flex text-sm font-semibold text-gray-800">
              Employment Type{" "}
              <span className="text-red-500 ml-1">
                *
              </span>
            </label>

            <select
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
              {...register("employmentType", {
                required:
                  "Employment type is required",
              })}
            >
              <option value="" disabled>
                Select Employment Type
              </option>

              {employmentTypes.map((type) => (
                <option
                  key={type.id}
                  value={type.name}
                >
                  {type.name}
                </option>
              ))}
            </select>

            {errors.employmentType && (
              <p className="mt-1 text-xs text-red-500">
                {errors.employmentType.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex text-sm font-semibold text-gray-800">
              Location{" "}
              <span className="text-red-500 ml-1">
                *
              </span>
            </label>

            <FormInput
              type="text"
              placeholder="e.g. Karachi / Remote"
              name="location"
              register={register}
              errors={errors}
              rules={{
                required: "Location is required",
              }}
            />
          </div>

          <div>
            <label className="flex text-sm font-semibold text-gray-800">
              Number of Openings{" "}
              <span className="text-red-500 ml-1">
                *
              </span>
            </label>

            <FormInput
              type="number"
              name="openings"
              register={register}
              errors={errors}
              rules={{
                required:
                  "Number of openings is required",
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex text-sm font-semibold text-gray-800">
              Experience Level{" "}
              <span className="text-red-500 ml-1">
                *
              </span>
            </label>

            <select
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
              {...register("experienceLevel", {
                required:
                  "Experience level is required",
              })}
            >
              <option value="" disabled>
                Select Experience Level
              </option>

              <option value="Entry">Entry</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
            </select>

            {errors.experienceLevel && (
              <p className="mt-1 text-xs text-red-500">
                {errors.experienceLevel.message}
              </p>
            )}
          </div>

          <div>
            <label className="flex text-sm font-semibold text-gray-800">
              Application Deadline{" "}
              <span className="text-red-500 ml-1">
                *
              </span>
            </label>

            <FormInput
              type="date"
              name="deadline"
              register={register}
              errors={errors}
              min={getTomorrowDate()}
              rules={{
                required:
                  "Application deadline is required",
              }}
            />
          </div>
        </div>

        <p className="pt-2 text-xs font-semibold uppercase text-gray-500">
          Compensation
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex text-sm font-semibold text-gray-800">
              Salary Range — Min (PKR){" "}
              <span className="text-red-500 ml-1">
                *
              </span>
            </label>

            <FormInput
              type="number"
              placeholder="350000"
              name="salaryMin"
              register={register}
              errors={errors}
              rules={{
                required:
                  "Minimum salary is required",
              }}
            />
          </div>

          <div>
            <label className="flex text-sm font-semibold text-gray-800">
              Salary Range — Max (PKR){" "}
              <span className="text-red-500 ml-1">
                *
              </span>
            </label>

            <FormInput
              type="number"
              placeholder="420000"
              name="salaryMax"
              register={register}
              errors={errors}
              rules={{
                required:
                  "Maximum salary is required",
              }}
            />
          </div>
        </div>

        <p className="pt-2 text-xs font-semibold uppercase text-gray-500">
          Description
        </p>

        <div>
          <label className="flex text-sm font-semibold text-gray-800">
            Job Description{" "}
            <span className="text-red-500 ml-1">
              *
            </span>
          </label>

          <textarea
            placeholder="Summarize responsibilities and impact of this role..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
            {...register("description", {
              required:
                "Job description is required",
            })}
          />

          {errors.description && (
            <p className="mt-1 text-xs text-red-500">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label className="flex text-sm font-semibold text-gray-800">
            Requirements / Must-have Skills{" "}
            <span className="text-red-500 ml-1">
              *
            </span>
          </label>

          <textarea
            placeholder="React, TypeScript, 5+ years experience, System Design..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
            {...register("requirements", {
              required:
                "Requirements / Must-have Skills are required",
            })}
          />

          {errors.requirements && (
            <p className="mt-1 text-xs text-red-500">
              {errors.requirements.message}
            </p>
          )}

          <p className="mt-1 text-xs text-gray-400">
            Comma-separated — used by ATS Ranking
            for auto-scoring.
          </p>
        </div>

        <p className="pt-2 text-xs font-semibold uppercase text-gray-500">
          Publishing
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() =>
              setValue("publishOption", "draft")
            }
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${
              publishOption === "draft"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-600"
            }`}
          >
            📝 Save as Draft
          </button>

          <button
            type="button"
            onClick={() =>
              setValue("publishOption", "publish")
            }
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${
              publishOption === "publish"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-600"
            }`}
          >
            🌐 Publish to Career Portal
          </button>
        </div>

        <div className="mt-4 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button
            type="button"
            text="Cancel"
            onClick={onClose}
            variant="secondary"
          />

          <Button
            type="submit"
            text="Save Requisition"
          />
        </div>
      </form>
    </Modal>
  );
};

export default NewRequisition;

