import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

import { getRole } from "../lib/api/authroleApi";
import { AuthContext } from "./AuthContextValue";

const safeReadStoredUser = () => {
  try {
    const savedUser = localStorage.getItem("user");

    if (
      !savedUser ||
      savedUser === "undefined" ||
      savedUser === "null"
    ) {
      return null;
    }

    return JSON.parse(savedUser);
  } catch {
    console.warn(
      "Invalid stored user data, clearing it."
    );

    localStorage.removeItem("user");

    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    () => safeReadStoredUser()
  );

  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );

  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // =====================================================
  // LOGIN
  // =====================================================

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    localStorage.setItem(
      "token",
      tokenData
    );
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // =====================================================
  // EXPIRED SESSION
  // =====================================================

  const handleExpiredSession = useCallback(() => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    toast.success(
      "Session expired. Please login again."
    );

    setTimeout(() => {
      window.location.href = "/login";
    }, 2500);
  }, []);

  // =====================================================
  // JWT EXPIRATION CHECK
  // =====================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    try {
      const decodedToken = jwtDecode(token);

      if (!decodedToken.exp) {
        console.warn(
          "Token does not contain expiration time."
        );

        return;
      }

      const expirationTime =
        decodedToken.exp * 1000;

      const currentTime = Date.now();

      if (expirationTime <= currentTime) {
        const timeout = setTimeout(() => {
          handleExpiredSession();
        }, 0);

        return () => clearTimeout(timeout);
      }

      const timeout = setTimeout(() => {
        handleExpiredSession();
      }, expirationTime - currentTime);

      return () => clearTimeout(timeout);
    } catch (error) {
      console.error(
        "Invalid JWT token:",
        error
      );

      const timeout = setTimeout(() => {
        handleExpiredSession();
      }, 0);

      return () => clearTimeout(timeout);
    }
  }, [token, handleExpiredSession]);

  // =====================================================
  // REFRESH PERMISSIONS
  // =====================================================

  const refreshPermissions = useCallback(
    async () => {
      try {
        const currentUser = userRef.current;

        if (!currentUser) {
          return;
        }

        if (!currentUser.role) {
          return;
        }

        // =================================================
        // GET ROLE NAME
        // =================================================

        const roleName =
          typeof currentUser.role === "string"
            ? currentUser.role
            : currentUser.role?.roleName ||
              currentUser.role?.name ||
              currentUser.roleName ||
              "";

        const normalizedRole =
          String(roleName)
            .toLowerCase()
            .replace(/\s+/g, "")
            .trim();

        // =================================================
        // SUPER ADMIN
        // =================================================

        if (
          normalizedRole === "superadmin"
        ) {
          console.log(
            "Super Admin detected - keeping existing permissions."
          );

          return;
        }

        // =================================================
        // INTERVIEWER
        // =================================================
        //
        // IMPORTANT:
        //
        // Interviewer should NOT call:
        //
        // GET /roles/:roleId
        //
        // because backend protects that endpoint with
        // users.view permission.
        //
        // Interviewer's permissions received during login
        // are kept as they are.
        // =================================================

        if (
          normalizedRole === "interviewer"
        ) {
          console.log(
            "Interviewer detected - keeping existing permissions."
          );

          return;
        }

        // =================================================
        // OTHER ROLES
        // =================================================

        if (
          typeof currentUser.role !== "object"
        ) {
          return;
        }

        const roleId =
          currentUser.role?.id ||
          currentUser.role?._id;

        if (!roleId) {
          console.log(
            "Role ID not found"
          );

          return;
        }

        // =================================================
        // GET LATEST ROLE
        // =================================================

        const response =
          await getRole(roleId);

        const latestRole =
          response?.data?.data ||
          response?.data;

        if (!latestRole) {
          console.log(
            "Role data not found"
          );

          return;
        }

        // =================================================
        // UPDATED ROLE
        // =================================================

        const updatedRole = {
          ...currentUser.role,

          id:
            latestRole.id ||
            latestRole._id ||
            roleId,

          _id:
            latestRole._id ||
            latestRole.id ||
            roleId,

          roleName:
            latestRole.roleName ||
            currentUser.role.roleName,

          permissions:
            latestRole.permissions ||
            [],
        };

        // =================================================
        // NO CHANGE
        // =================================================

        if (
          JSON.stringify(
            currentUser.role
          ) ===
          JSON.stringify(updatedRole)
        ) {
          return;
        }

        // =================================================
        // UPDATE USER
        // =================================================

        const updatedUser = {
          ...currentUser,
          role: updatedRole,
        };

        setUser(updatedUser);

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

      } catch (error) {
        // =================================================
        // IMPORTANT:
        // Never remove existing permissions when refresh
        // fails.
        // =================================================

        console.log(
          "Permission refresh failed. Existing permissions will be kept.",
          error.response?.data ||
            error.message
        );
      }
    },
    []
  );

  // =====================================================
  // ROLE ID
  // =====================================================

  const roleId =
    typeof user?.role === "object"
      ? user?.role?.id ||
        user?.role?._id
      : user?.role;

  // =====================================================
  // REFRESH ON LOGIN / ROLE CHANGE
  // =====================================================

  useEffect(() => {
    if (!token || !roleId) {
      return;
    }

    refreshPermissions();
  }, [
    token,
    roleId,
    refreshPermissions,
  ]);

  // =====================================================
  // CONTEXT
  // =====================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        refreshPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};