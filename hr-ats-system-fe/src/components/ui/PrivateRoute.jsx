import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const PrivateRoute = ({ module, requires = [] }) => {
  const { token, user } = useAuth();

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Normal protected route
  if (!module) {
    return <Outlet />;
  }

  const roleName =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.roleName || "";

  const normalizedRole = String(roleName)
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

  // Super Admin has full access
  if (normalizedRole === "superadmin") {
    return <Outlet />;
  }

  const permissions =
    user?.role?.permissions || [];

  const modulesToCheck = [
    module,
    ...requires,
  ];

  const hasAccess = modulesToCheck.every(
    (requiredModule) => {
      const permission = permissions.find(
        (item) =>
          String(item?.module)
            .toLowerCase()
            .trim() ===
          String(requiredModule)
            .toLowerCase()
            .trim()
      );

      return (
        permission?.view === true ||
        permission?.view === "true"
      );
    }
  );

  if (!hasAccess) {
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