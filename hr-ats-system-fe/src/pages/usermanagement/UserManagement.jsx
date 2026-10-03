import { useEffect, useState } from "react";
import Table from "../../components/ui/Table";
import NewUserModal from "./NewUserModal";

import { getUsers, deleteUser } from "../../lib/api/authApi";

import { useAuth } from "../../context/useAuth";
import { toast } from "sonner";

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState(0);

  const permissions = user?.role?.permissions || [];

  const getPermission = (action) => {
    const permission = permissions.find(
      (item) => item.module === "users"
    );

    return permission?.[action] === true;
  };

  const canView = getPermission("view");
  const canCreate = getPermission("create");
  const canEdit = getPermission("edit");
  const canDelete = getPermission("delete");

  // =========================
  // GET USERS
  // =========================
  const loadUsers = async () => {
    try {
      const response = await getUsers();

      const fetchedUsers = response.data?.data;

      const usersData = Array.isArray(fetchedUsers)
        ? fetchedUsers
        : [];

      setUsers(usersData);

      setPendingInvites(
        response.data?.pendingInvites ?? 0
      );
    } catch (error) {
      console.log(
        "Get users error:",
        error.response?.data || error.message
      );

      setUsers([]);
      setPendingInvites(0);
    }
  };

  // =========================
  // DELETE USER
  // =========================
  const handleDeleteUser = (selected) => {
    if (!selected?._id) {
      toast.error("User ID not found");
      return;
    }

    toast.warning(
      "Are you sure you want to delete this user?",
      {
        duration: Infinity,

        action: {
          label: "Delete",

          onClick: async () => {
            try {
              await deleteUser(selected._id);

              // Refresh users after deletion
              await loadUsers();

              toast.success(
                "User deleted successfully"
              );
            } catch (error) {
              console.log(
                "Delete user error:",
                error.response?.data || error.message
              );

              toast.error(
                error.response?.data?.message ||
                  "Failed to delete user"
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

  // =========================
  // LOAD USERS ON PAGE LOAD
  // =========================
  useEffect(() => {
    if (!canView) {
      return;
    }

    const loadTimeout = setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => clearTimeout(loadTimeout);
  }, [canView]);

  // =========================
  // ACCESS DENIED
  // =========================
  if (!canView) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold text-gray-900">
          Access Denied
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          You do not have permission to view users.
        </p>
      </div>
    );
  }

  // =========================
  // TABLE COLUMNS
  // =========================
  const columns = [
    "NAME",
    "EMAIL",
    "ROLE",
    "DEPARTMENT",
    "STATUS",
    "LAST LOGIN",
    "ACTION",
  ];

  // =========================
  // UI
  // =========================
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl ml-7 mt-6 font-semibold text-gray-900">
            User Management
          </h2>

          <p className="text-gray-500 ml-7 text-sm">
            {users.length} internal users •{" "}
            {pendingInvites} pending invites
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setSelectedUser(null);
              setShowModal(true);
            }}
            className="bg-blue-700 mr-9 hover:bg-blue-800 text-white font-semibold px-3 py-1 rounded-xl shadow-sm transition"
          >
            + New User
          </button>
        )}
      </div>

      <div className="mx-8 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <Table
          columns={columns}
          data={users}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={(selected) => {
            setSelectedUser(selected);
            setShowModal(true);
          }}
          onDelete={handleDeleteUser}
        />
      </div>

      <NewUserModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedUser(null);
        }}
        onCreated={loadUsers}
        user={selectedUser}
      />
    </>
  );
};

export default UserManagement;