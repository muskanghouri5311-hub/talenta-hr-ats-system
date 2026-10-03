
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import Modal from "../../components/ui/Modal";
import FormInput from "../../components/ui/FormInput";
import Button from "../../components/ui/Button";

import {
  createUser,
  updateUser,
} from "../../lib/api/authApi";

import {
  getDepartmentLookup,
  getRolesLookup,
} from "../../lib/api/authdepApi";

const NewUserModal = ({
  isOpen,
  onClose,
  onCreated,
  user,
}) => {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // ==========================================
  // LOAD ROLES + DEPARTMENTS
  // ==========================================

  useEffect(() => {
    if (!isOpen) return;

    const loadLookups = async () => {
      try {
        const [roleResponse, departmentResponse] =
          await Promise.all([
            getRolesLookup(),
            getDepartmentLookup(),
          ]);

        setRoles(roleResponse.data?.data ?? []);

        setDepartments(
          departmentResponse.data?.data ?? []
        );
      } catch (error) {
        console.log(
          "Lookup Error:",
          error.response?.data
        );

        toast.error(
          error.response?.data?.message ||
          "Failed to load roles and departments"
        );
      }
    };

    loadLookups();
  }, [isOpen]);

  // ==========================================
  // POPULATE USER DATA
  // ONLY AFTER LOOKUPS ARE AVAILABLE
  // ==========================================

  useEffect(() => {
    if (!isOpen) return;

    // CREATE USER
    if (!user) {
      reset({
        name: "",
        email: "",
        phoneNumber: "",
        role: "",
        department: "",
      });

      return;
    }

    // Don't populate role/department
    // until lookup data is available
    if (
      roles.length === 0 ||
      departments.length === 0
    ) {
      return;
    }

    // ========================================
    // FIND USER ROLE ID
    // ========================================

    let roleId = "";

    if (user.role) {
      if (typeof user.role === "object") {
        roleId =
          user.role._id ||
          user.role.id ||
          "";
      } else if (typeof user.role === "string") {
        const matchedRole = roles.find(
          (role) =>
            role._id === user.role ||
            role.id === user.role ||
            role.name === user.role ||
            role.roleName === user.role ||
            role.label === user.role ||
            role.title === user.role
        );

        roleId =
          matchedRole?._id ||
          matchedRole?.id ||
          user.role;
      }
    }

    // ========================================
    // FIND USER DEPARTMENT ID
    // ========================================

    let departmentId = "";

    if (user.department) {
      if (
        typeof user.department === "object"
      ) {
        departmentId =
          user.department._id ||
          user.department.id ||
          "";
      } else if (
        typeof user.department === "string"
      ) {
        const matchedDepartment =
          departments.find(
            (department) =>
              department._id ===
                user.department ||
              department.id ===
                user.department ||
              department.name ===
                user.department ||
              department.label ===
                user.department ||
              department.title ===
                user.department
          );

        departmentId =
          matchedDepartment?._id ||
          matchedDepartment?.id ||
          user.department;
      }
    }

    // ========================================
    // SET COMPLETE FORM
    // ========================================

    reset({
      name: user.name ?? "",
      email: user.email ?? "",
      phoneNumber:
        user.phoneNumber ?? "",
      role: roleId,
      department: departmentId,
    });
  }, [
    isOpen,
    user,
    roles,
    departments,
    reset,
  ]);

  // ==========================================
  // CREATE USER
  // ==========================================

  const handleCreate = async (data) => {
    try {
      await createUser(data);

      toast.success(
        "User created and invitation sent"
      );

      if (onCreated) {
        await onCreated();
      }

      onClose();
    } catch (error) {
      console.log(
        error.response?.data
      );

      toast.error(
        error.response?.data?.message ||
        "Failed to create user"
      );
    }
  };

  // ==========================================
  // UPDATE USER
  // ==========================================

  const handleUpdate = async (data) => {
    try {
      await updateUser(user._id, data);

      toast.success(
        "User updated successfully"
      );

      if (onCreated) {
        await onCreated();
      }

      onClose();
    } catch (error) {
      console.log(
        error.response?.data
      );

      toast.error(
        error.response?.data?.message ||
        "Failed to update user"
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        user
          ? "Update User"
          : "New User"
      }
      subtitle="Grant system access and assign a role"
    >
      <form
        onSubmit={handleSubmit(
          user
            ? handleUpdate
            : handleCreate
        )}
        className="space-y-4"
      >
        {/* FULL NAME */}

        <div>
          <label className="text-sm font-semibold text-gray-800 flex">
            Full Name{" "}
            <span className="text-red-500 ml-1">
              *
            </span>
          </label>

          <FormInput
            type="text"
            placeholder="Enter full name"
            name="name"
            register={register}
            errors={errors}
            rules={{
              required: "Name is required",
              pattern: {
                value: /^[A-Za-z\s]+$/,
                message:
                  "Name can contain letters and spaces only",
              },
            }}
          />
        </div>

        {/* EMAIL */}

        <div>
          <label className="text-sm font-semibold text-gray-800 flex">
            Work Email{" "}
            <span className="text-red-500 ml-1">
              *
            </span>
          </label>

          <FormInput
            type="email"
            placeholder="name@company.com"
            name="email"
            register={register}
            errors={errors}
            rules={{
              required: "Email is required",
              pattern: {
                value:
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message:
                  "Please enter a valid email address",
              },
            }}
          />
        </div>

        {/* PHONE */}

        <div>
          <label className="text-sm font-semibold text-gray-800 flex">
            Phone{" "}
            <span className="text-red-500 ml-1">
              *
            </span>
          </label>

          <FormInput
            type="text"
            placeholder="+923xxxxxxxxx"
            name="phoneNumber"
            register={register}
            errors={errors}
            rules={{
              required: "Phone number is required",
              pattern: {
                value: /^\+923\d{2}\d{7}$/,
                message:
                  "Use format +923xxxxxxxxx",
              },
            }}
          />
        </div>

        {/* ROLE */}

        <div>
          <label className="text-sm font-semibold text-gray-800 flex">
            Role{" "}
            <span className="text-red-500 ml-1">
              *
            </span>
          </label>

          <select
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
            {...register("role", {
              required: "Role is required",
            })}
          >
            <option value="">
              Select Role
            </option>

            {roles.map((role) => (
              <option
                key={
                  role._id ??
                  role.id
                }
                value={
                  role._id ??
                  role.id
                }
              >
                {role.name ??
                  role.roleName ??
                  role.label ??
                  role.title}
              </option>
            ))}
          </select>

          {errors.role && (
            <p className="text-red-500 text-sm mt-1">
              {errors.role.message}
            </p>
          )}
        </div>

        {/* DEPARTMENT */}

        <div>
          <label className="text-sm font-semibold text-gray-800 flex">
            Department{" "}
            <span className="text-red-500 ml-1">
              *
            </span>
          </label>

          <select
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
            {...register("department", {
              required:
                "Department is required",
            })}
          >
            <option value="">
              Select Department
            </option>

            {departments.map(
              (department) => (
                <option
                  key={
                    department._id ??
                    department.id
                  }
                  value={
                    department._id ??
                    department.id
                  }
                >
                  {department.name ??
                    department.label ??
                    department.title}
                </option>
              )
            )}
          </select>

          {errors.department && (
            <p className="text-red-500 text-sm mt-1">
              {errors.department.message}
            </p>
          )}
        </div>

        {/* BUTTONS */}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            text="Cancel"
            onClick={onClose}
            variant="secondary"
          />

          <Button
            type="submit"
            text={
              user
                ? "Update User"
                : "Create User"
            }
          />
        </div>
      </form>
    </Modal>
  );
};

export default NewUserModal;
