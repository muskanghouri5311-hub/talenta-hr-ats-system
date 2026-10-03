import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import Button from "../../components/ui/Button";
import RoleCard from "../../components/ui/RoleCard";
import CreateRoleModal from "../../components/ui/CreateRoleModal";

import { useAuth } from "../../context/useAuth";
import { hasPermission } from "../../components/utils/permissions";

import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from "../../lib/api/authroleApi";

function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const { user } = useAuth();

  // =========================================
  // CURRENT USER ROLE
  // =========================================

  const canViewRoles = hasPermission(user, "roles", "view");
  const canCreateRoles = hasPermission(user, "roles", "create");
  const canEditRoles = hasPermission(user, "roles", "edit");
  const canDeleteRoles = hasPermission(user, "roles", "delete");

  // =========================================
  // FETCH ALL ROLES
  // =========================================

  const fetchRoles = useCallback(async () => {
    if (!canViewRoles) {
      setRoles([]);
      return [];
    }

    try {
      setLoadingRoles(true);

      const response = await getRoles();

      /*
       * API response:
       *
       * {
       *   success: true,
       *   count: 5,
       *   data: [...]
       * }
       */

      const roleData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

      setRoles(roleData);

      return roleData;
    } catch (error) {
      console.error(
        "FETCH ROLES ERROR:",
        error.response?.data || error.message
      );

      setRoles([]);

      toast.error(
        error.response?.data?.message ||
          "Failed to load roles"
      );

      return [];
    } finally {
      setLoadingRoles(false);
    }
  }, [canViewRoles]);

  // =========================================
  // LOAD ROLES
  // =========================================

  useEffect(() => {
    if (user && canViewRoles) {
      void Promise.resolve().then(fetchRoles);
    }
  }, [user, canViewRoles, fetchRoles]);

  // =========================================
  // CREATE NEW ROLE
  // =========================================

  const handleNewRoleClick = () => {
    if (!canCreateRoles) {
      toast.error(
        "You do not have permission to create roles"
      );
      return;
    }

    setEditingRole(null);
    setSaveError("");
    setLoadingRole(false);
    setOpenModal(true);
  };

  // =========================================
  // OPEN ROLE
  // =========================================

  const handleCardClick = async (roleStub) => {
    if (!roleStub?._id) {
      return;
    }

    const roleName = String(
      roleStub?.roleName || ""
    )
      .toLowerCase()
      .replace(/\s+/g, "")
      .trim();

    // =========================================
    // SUPER ADMIN PROTECTED
    // =========================================

    if (roleName === "superadmin") {
      toast.info(
        "Super Admin role cannot be edited."
      );

      return;
    }

    // =========================================
    // EDIT PERMISSION
    // =========================================

    if (!canEditRoles) {
      toast.error(
        "You do not have permission to edit roles"
      );

      return;
    }

    setSaveError("");
    setLoadingRole(true);
    setEditingRole(null);
    setOpenModal(true);

    try {
      const response = await getRole(
        roleStub._id
      );

      /*
       * API:
       *
       * {
       *   success: true,
       *   data: role
       * }
       */

      const roleData =
        response?.data?.data ||
        response?.data ||
        null;

      if (!roleData) {
        throw new Error(
          "Role data not found"
        );
      }

      setEditingRole(roleData);
    } catch (error) {
      console.error(
        "GET ROLE ERROR:",
        error.response?.data ||
          error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to load role"
      );

      setOpenModal(false);
      setEditingRole(null);
    } finally {
      setLoadingRole(false);
    }
  };

  // =========================================
  // SAVE ROLE
  // =========================================

  const handleSaveRole = async (payload) => {
    setSaveError("");

    try {
      // =====================================
      // EDIT
      // =====================================

      if (editingRole?._id) {
        if (!canEditRoles) {
          toast.error(
            "You do not have permission to edit roles"
          );

          return;
        }

        await updateRole(
          editingRole._id,
          payload
        );

        toast.success(
          "Role updated successfully"
        );
      }

      // =====================================
      // CREATE
      // =====================================

      else {
        if (!canCreateRoles) {
          toast.error(
            "You do not have permission to create roles"
          );

          return;
        }

        await createRole(payload);

        toast.success(
          "Role created successfully"
        );
      }

      // =====================================
      // REFRESH LIST
      // =====================================

      await fetchRoles();

      setOpenModal(false);
      setEditingRole(null);
    } catch (error) {
      console.error(
        "SAVE ROLE ERROR:",
        error.response?.data ||
          error.message
      );

      const message =
        error.response?.data?.message ||
        "Role didn't save. Try again";

      setSaveError(message);

      toast.error(message);
    }
  };

  // =========================================
  // DELETE ROLE
  // =========================================

  const handleDeleteRole = (roleToDelete) => {
    if (!canDeleteRoles) {
      toast.error(
        "You do not have permission to delete roles"
      );

      return;
    }

    const targetId =
      roleToDelete?._id ||
      editingRole?._id;

    if (!targetId) {
      return;
    }

    const roleName =
      roleToDelete?.roleName ||
      editingRole?.roleName ||
      "this role";

    const normalizedRoleName = String(
      roleName
    )
      .toLowerCase()
      .replace(/\s+/g, "")
      .trim();

    // =========================================
    // SUPER ADMIN PROTECTED
    // =========================================

    if (
      normalizedRoleName === "superadmin"
    ) {
      toast.info(
        "Super Admin role cannot be deleted."
      );

      return;
    }

    toast.warning(
      `Are you sure you want to delete "${roleName}"? This action cannot be undone.`,
      {
        duration: Infinity,

        action: {
          label: "Delete",

          onClick: async () => {
            try {
              await deleteRole(targetId);

              await fetchRoles();

              setOpenModal(false);
              setEditingRole(null);

              toast.success(
                "Role deleted successfully"
              );
            } catch (error) {
              console.error(
                "DELETE ROLE ERROR:",
                error.response?.data ||
                  error.message
              );

              toast.error(
                error.response?.data?.message ||
                  "Failed to delete role"
              );
            }
          },
        },

        cancel: {
          label: "Cancel",
        },
      }
    );
  };

  // =========================================
  // NO USER
  // =========================================

  if (!user) {
    return null;
  }

  // =========================================
  // NO VIEW PERMISSION
  // =========================================

  if (!canViewRoles) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
          You do not have permission to view
          Roles & Permissions.
        </div>
      </div>
    );
  }

  // =========================================
  // UI
  // =========================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="mb-5 flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Roles & Permissions
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Control what each role can view,
            create, edit and delete.
          </p>
        </div>

        {/* CREATE ONLY IF PERMITTED */}

        {canCreateRoles && (
          <Button
            text="+ New Role"
            onClick={handleNewRoleClick}
          />
        )}
      </div>

      {/* =====================================
          LOADING
      ===================================== */}

      {loadingRoles ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400">
          Loading roles...
        </div>
      ) : (
        <>
          {/* =================================
              ROLE CARDS
          ================================= */}

          <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-3">

            {roles.map((role) => (
              <RoleCard
                key={role._id}
                role={role}
                selectedRole={editingRole}
                setSelectedRole={handleCardClick}
                onDelete={handleDeleteRole}
              />
            ))}

          </div>

          {/* NO ROLES */}

          {roles.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No roles found.
            </div>
          )}
        </>
      )}

      {/* =====================================
          ROLE MODAL
      ===================================== */}

      {openModal && (
        <CreateRoleModal
          isOpen={openModal}
          role={editingRole}
          loading={loadingRole}
          currentUser={user}

          onClose={() => {
            setOpenModal(false);
            setEditingRole(null);
            setSaveError("");
          }}

          onSave={handleSaveRole}

          onDelete={handleDeleteRole}

          errorMessage={saveError}
        />
      )}
    </div>
  );
}

export default RolesPermissions;