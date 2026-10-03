import { Lock, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import Button from "../../components/ui/Button";
import FormInput from "./FormInput";
import PermissionTable from "./PermissionTable";
import { isSuperAdmin } from "../utils/permissions";

const modules = [
  {
    label: "Dashboard",
    key: "dashboard",
  },
  {
    label: "Job Requisitions",
    key: "jobRequisitions",
  },
  {
    label: "Candidates",
    key: "candidates",
  },
  {
    label: "ATS Ranking",
    key: "atsRanking",
  },
  {
    label: "Interviews",
    key: "interviews",
  },
  {
    label: "Offer Letters",
    key: "offerLetters",
  },
  {
    label: "Users",
    key: "users",
  },
  {
    label: "Departments",
    key: "departments",
  },
  {
    label: "Roles & Permissions",
    key: "roles",
  },
  {
    label: "Audit Logs",
    key: "auditLogs",
  },
  {
    label: "Reports",
    key: "reports",
  },
];

function buildDefaultPermissions(role) {
  const permissionData = {};

  modules.forEach((module) => {
    permissionData[module.key] = {
      view: false,
      create: false,
      edit: false,
      delete: false,
    };
  });

  (role?.permissions || []).forEach((item) => {
    if (permissionData[item.module]) {
      permissionData[item.module] = {
        view: item.view || false,
        create: item.create || false,
        edit: item.edit || false,
        delete: item.delete || false,
      };
    }
  });

  return permissionData;
}

function CreateRoleModal({
  isOpen,
  onClose,
  onSave,
  errorMessage,
  role,
  loading,
  currentUser,
}) {
  const isEditing = Boolean(role?._id);

  // =====================================
  // CURRENT LOGGED-IN USER ROLE
  // =====================================

  const canEditPermissions =
    isSuperAdmin(currentUser);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    defaultValues: {
      roleName: "",
      description: "",
      permissions:
        buildDefaultPermissions(null),
    },
  });

  // =====================================
  // LOAD ROLE DATA
  // =====================================

  useEffect(() => {
    if (!isOpen || loading) return;

    reset({
      roleName: role?.roleName || "",
      description: role?.description || "",
      permissions:
        buildDefaultPermissions(role),
    });
  }, [
    isOpen,
    loading,
    role,
    reset,
  ]);

  if (!isOpen) return null;

  // =====================================
  // SUBMIT
  // =====================================

  const submitHandler = async (data) => {
    const permissions = modules.map(
      (module) => ({
        module: module.key,

        view:
          data.permissions?.[
            module.key
          ]?.view || false,

        create:
          data.permissions?.[
            module.key
          ]?.create || false,

        edit:
          data.permissions?.[
            module.key
          ]?.edit || false,

        delete:
          data.permissions?.[
            module.key
          ]?.delete || false,
      })
    );

    const payload = isEditing
      ? {
          description: data.description,
          permissions,
        }
      : {
          roleName: data.roleName,
          description: data.description,
          permissions,
        };

    await onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4">

      <div className="flex max-h-[calc(90vh-30px)] w-full max-w-[800px] flex-col overflow-hidden rounded-[18px] bg-white shadow-2xl">

        {/* ================= HEADER ================= */}

        <div className="flex items-start justify-between border-b border-slate-200 px-7 py-3">

          <div>
            <h2 className="text-[18px] font-bold leading-6 text-slate-900">
              {isEditing
                ? "Edit Role"
                : "Create Role"}
            </h2>

            <p className="mt-0.5 text-[12px] text-slate-500">
              {loading
                ? "Loading role data..."
                : isEditing
                ? "Update the description and module-level permissions"
                : "Define a name and module-level permissions"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3 w-3" />
          </button>

        </div>

        {/* ================= LOADING ================= */}

        {loading ? (
          <div className="px-7 py-8 text-center text-sm text-slate-400">
            Loading...
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(
              submitHandler
            )}
            className="flex min-h-0 flex-1 flex-col"
          >

            <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5">

              {/* ================= ERROR ================= */}

              {errorMessage && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                  {errorMessage}
                </div>
              )}

              {/* ================= PERMISSION INFO ================= */}

              {!canEditPermissions && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">

                  <Lock className="h-3 w-3 shrink-0" />

                  <span>
                    Only Super Admin can change
                    role permissions.
                  </span>

                </div>
              )}

              {/* ================= ROLE NAME ================= */}

              <div className="mb-4">

                <label className="mb-1.5 block text-[12px] font-semibold text-slate-800">
                  Role Name{" "}
            <span className="text-red-500 ml-1">
              *
            </span>
                </label>

                <FormInput
                  type="text"
                  name="roleName"
                  placeholder="e.g. Hiring Manager"
                  register={register}
                  errors={errors}
                  disabled={isEditing}
                  rules={{
                    required:
                      "Role Name is required",
                  }}
                />

                {isEditing && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Role name cannot be changed
                    after creation.
                  </p>
                )}

              </div>

              {/* ================= DESCRIPTION ================= */}

              <div className="mb-5">

                <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">
                  Description{" "}
            <span className="text-red-500 ml-1">
              *
            </span>
                </label>

                <FormInput
                  type="text"
                  name="description"
                  placeholder="e.g. Reviews shortlisted candidates for their team's roles"
                  register={register}
                  errors={errors}
                  disabled={false}
                  rules={{
                    required:
                      "Description is required",
                  }}
                />

              </div>

              {/* ================= PERMISSIONS ================= */}

              <div>

              

                <PermissionTable
                  modules={modules}
                  register={register}
                  errors={errors}
                  disabled={
                    !canEditPermissions
                  }
                  watch={watch}
                  setValue={setValue}
                />

              </div>

            </div>

            {/* ================= FOOTER ================= */}

            <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-7 py-4">

              <Button
                type="button"
                text="Cancel"
                variant="secondary"
                onClick={onClose}
              />

              <Button
                type="submit"
                text={
                  isSubmitting
                    ? "Saving..."
                    : isEditing
                    ? "Save Changes"
                    : "Save Role"
                }
                disabled={isSubmitting}
              />

            </div>

          </form>
        )}

      </div>
    </div>
  );
}

export default CreateRoleModal;