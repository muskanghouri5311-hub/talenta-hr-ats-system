import { Route } from "react-router-dom";

import Login from "../pages/auth/LoginPage";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import ChangePassword from "../pages/ChangePassword";
import UpdatePassword from "../pages/UpdatePassword";

const AuthRoutes = () => {
  return (
    <>
      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password/:token"
        element={<ResetPassword />}
      />

      <Route
        path="/change-password"
        element={<ChangePassword />}
      />

      <Route
        path="/update-password/:token"
        element={<UpdatePassword />}
      />
    </>
  );
};

export default AuthRoutes;