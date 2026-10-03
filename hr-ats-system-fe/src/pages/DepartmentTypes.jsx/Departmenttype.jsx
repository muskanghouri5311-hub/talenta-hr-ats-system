import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { toast } from "sonner";

import DeptTable from "./DeptTable";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
} from "../../lib/api/authdepApi";

const Departmenttype = () => {
  const [showModal, setShowModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [editDepartment, setEditDepartment] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();

  const fetchDepartments = async () => {
    try {
      const response = await getDepartments();

      const fetchedDepartments = response.data?.data;

      const departmentsData = Array.isArray(fetchedDepartments)
        ? fetchedDepartments
        : [];

      if (!Array.isArray(fetchedDepartments)) {
        console.warn(
          "getDepartments returned unexpected payload:",
          fetchedDepartments
        );
      }

      const sortedDepartments = [...departmentsData].sort((a, b) => {
        if (a?.createdAt && b?.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }

        return (b?._id ?? "")
          .toString()
          .localeCompare((a?._id ?? "").toString());
      });

      setDepartments(sortedDepartments);
    } catch (error) {
      console.error("Error fetching departments:", error);

      setDepartments([]);

      toast.error(
        error?.response?.data?.message ||
          "Failed to load departments."
      );
    }
  };

  // ================= INITIAL LOAD =================

  useEffect(() => {
    const initializers = async () => {
      await fetchDepartments();
    };

    initializers();
  }, []);

  // ================= ADD MODAL =================

  const openAddModal = () => {
    setEditDepartment(null);
    reset();
    setShowModal(true);
  };

  // ================= EDIT =================

  const handleEdit = (department) => {
    setEditDepartment(department);

    setValue("departmentName", department.name);

    setValue(
      "departmentHead",
      department.headName || ""
    );

    setShowModal(true);
  };

  // ================= CLOSE MODAL =================

  const closeModal = () => {
    setShowModal(false);
    setEditDepartment(null);
    reset();
  };

  // ================= SUBMIT =================

  const onSubmit = async (data) => {
    try {
      const departmentName =
        data.departmentName.trim();

      const departmentHead =
        data.departmentHead.trim();

      // ================= VALIDATION =================

      if (!departmentName) {
        toast.error(
          "Department name is required."
        );
        return;
      }

      if (!departmentHead) {
        toast.error(
          "Department head is required."
        );
        return;
      }

      // ================= UPDATE =================

      if (editDepartment) {
        const alreadyExists = departments.some(
          (department) =>
            department._id !==
              editDepartment._id &&
            department.name
              ?.trim()
              .toLowerCase() ===
              departmentName.toLowerCase()
        );

        if (alreadyExists) {
          toast.error(
            "Department already exists!"
          );
          return;
        }

        await updateDepartment(
          editDepartment._id,
          {
            name: departmentName,
            headName: departmentHead,
          }
        );

        toast.success(
          "Department updated successfully."
        );
      }

      // ================= CREATE =================

      else {
        const alreadyExists = departments.some(
          (department) =>
            department.name
              ?.trim()
              .toLowerCase() ===
            departmentName.toLowerCase()
        );

        if (alreadyExists) {
          toast.error(
            "Department already exists!"
          );
          return;
        }

        await createDepartment({
          name: departmentName,
          headName: departmentHead,
        });

        toast.success(
          "Department added successfully."
        );
      }

      // ================= REFRESH TABLE =================

      await fetchDepartments();

      // ================= CLOSE MODAL =================

      closeModal();
    } catch (error) {
      console.error(
        "Department error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Something went wrong."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-8 py-6">

      {/* ================= HEADER ================= */}

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h2 className="text-[22px] font-semibold leading-8 text-slate-900">
            Departments & Employment Types
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Reference data used across Job Requisitions
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-1 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
        >
          <span className="text-lg leading-none">
            +
          </span>

          Add Department
        </button>

      </div>

      {/* ================= TABLE ================= */}

      <DeptTable
        departments={departments}
        handleEdit={handleEdit}
      />

      {/* ================= MODAL ================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-[1px]">

          <div className="w-full max-w-130 overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* ================= HEADER ================= */}

            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editDepartment
                    ? "Update Department"
                    : "Add Department"}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {editDepartment
                    ? "Update department information"
                    : "Add a new department"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            {/* ================= FORM ================= */}

            <form
              onSubmit={handleSubmit(onSubmit)}
            >

              <div className="space-y-4 px-6 py-5">

                {/* Department Name */}

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">
                    Department Name{" "}
            <span className="text-red-500 ml-1">
              *
            </span>
                  </label>

                  <input
                    type="text"
                    placeholder="Enter department name"
                    {...register(
                      "departmentName",
                      {
                        required:
                          "Department name is required",

                        pattern: {
                          value:
                            /^[A-Za-z\s]+$/,

                          message:
                            "Name can contain letters and spaces only",
                        },
                      }
                    )}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  {errors.departmentName && (
                    <p className="mt-1 text-xs text-red-500">
                      {
                        errors.departmentName
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Department Head */}

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">
                    Department Head{" "}
            <span className="text-red-500 ml-1">
              *
            </span>
                  </label>

                  <input
                    type="text"
                    placeholder="Enter department head"
                    {...register(
                      "departmentHead",
                      {
                        required:
                          "Department head is required",

                        pattern: {
                          value:
                            /^[A-Za-z\s]+$/,

                          message:
                            "Name can contain letters and spaces only",
                        },
                      }
                    )}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  {errors.departmentHead && (
                    <p className="mt-1 text-xs text-red-500">
                      {
                        errors.departmentHead
                          .message
                      }
                    </p>
                  )}
                </div>

              </div>

              {/* ================= FOOTER ================= */}

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-800"
                >
                  {editDepartment
                    ? "Update Department"
                    : "Add Department"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default Departmenttype;