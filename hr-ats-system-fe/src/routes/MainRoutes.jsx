import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import AuthRoutes from "./AuthRoutes";
import ProtectedRoutes from "./ProtectedRoutes";
import CareerPortal from "../pages/CareerPortal/CareerPortal";
import ApplyPage from "../pages/CareerPortal/ApplyPage";

const MainRoutes = () => {
  const { token, user } = useAuth();

  const isAuthenticated = Boolean(token);

  // ==========================================
  // GET USER ROLE
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

  // ==========================================
  // DEFAULT ROUTE
  // ONLY INTERVIEWER -> MY INTERVIEWS
  // EVERYONE ELSE -> DASHBOARD
  // ==========================================

  const defaultRoute =
    normalizedRole === "interviewer"
      ? "/my-interviews"
      : "/dashboard";

  console.log("MAIN ROUTES USER:", user);
  console.log("MAIN ROUTES ROLE:", normalizedRole);
  console.log("MAIN ROUTES DEFAULT:", defaultRoute);

  return (
    <Routes>
      {/* ================= PUBLIC ROUTE ================= */}

      <Route
        path="/career-portal"
        element={<CareerPortal />}
      />

      <Route
        path="/apply/:jobId"
        element={<ApplyPage />}
      />

      {/* ================= AUTH / PROTECTED ================= */}

      {isAuthenticated
        ? ProtectedRoutes()
        : AuthRoutes()}

      {/* ================= FALLBACK ================= */}

      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated
                ? defaultRoute
                : "/login"
            }
            replace
          />
        }
      />
    </Routes>
  );
};

export default MainRoutes;