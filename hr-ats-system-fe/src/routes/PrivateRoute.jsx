import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const PrivateRoute = ({
  module,
  requires = [],
  interviewerOnly = false,
}) => {
  const {
    user,
    isAuthenticated,
  } = useAuth();

  // ==============================
  // NOT LOGGED IN
  // ==============================

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ==========================================
  // ROLE
  // ==========================================

  const roleName =
    typeof user?.role === "object"
      ? user?.role?.roleName ||
        user?.role?.name ||
        ""
      : user?.role || "";

  const normalizedRole = String(roleName)
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

    const isSuperAdmin =
  normalizedRole === "superadmin";
  const isInterviewer =
    normalizedRole === "interviewer";

  // ==========================================
  // INTERVIEWER ONLY
  // ==========================================

  if (interviewerOnly) {
    if (!isInterviewer) {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    // Candidate Pipeline, Dashboard,
    // ATS, Users, Roles, etc.
    // ALL blocked for interviewer.

    return (
      <Navigate
        to="/my-interviews"
        replace
      />
    );
  }

  // ==============================
  // SUPER ADMIN
  // ==============================

  if (isSuperAdmin) {
    return <Outlet />;
  }

  // ==========================================
  // PERMISSIONS
  // ==========================================

  const permissions =
    Array.isArray(user?.role?.permissions)
      ? user.role.permissions
      : [];

  const modulesToCheck = [
    module,
    ...requires,
  ].filter(Boolean);

  const hasPermission =
    modulesToCheck.every(
      (requiredModule) => {
        const permission =
          permissions.find(
            (item) =>
              String(item?.module || "")
                .toLowerCase()
                .trim() ===
              String(requiredModule || "")
                .toLowerCase()
                .trim()
          );

        return (
          permission?.view === true ||
          permission?.view === "true"
        );
      }
    );

  // ==========================================
  // DENIED
  // ==========================================

  if (!hasPermission) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
};

export default PrivateRoute;