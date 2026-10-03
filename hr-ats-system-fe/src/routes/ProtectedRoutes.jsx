import { Route, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import PrivateRoute from "../components/ui/PrivateRoute";

import Dashboard from "../pages/dashboard/Dashboard";
import JobRequisition from "../pages/JobRequistitions/JobRequisition";
import UserManagement from "../pages/usermanagement/UserManagement";
import RolesPermissions from "../pages/RolesPermissions/RolesPermissions";
import Departmenttype from "../pages/DepartmentTypes.jsx/Departmenttype";
import AuditLog from "../pages/Audit Log/AuditLog";
import ATSRanking from "../pages/ATSRanking/ATSRanking";
import CandidatePipeline from "../pages/CandidatePipeline/CandidatePipeline";
import Interviews from "../pages/interviews/Interviews";
import OfferLetters from "../pages/OfferLetters/OfferLetters";
import ReportsAnalytics from "../pages/report/ReportsAnalytics";
import Myinterviews from "../pages/myinterview/Myinterviews";

const ProtectedRoutes = () => {
  return (
    <Route element={<PrivateRoute />}>
      <Route element={<MainLayout />}>

        {/* ================= DASHBOARD ================= */}

        <Route
          element={
            <PrivateRoute module="dashboard" />
          }
        >
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />
        </Route>

        {/* ================= USERS ================= */}

        <Route
          element={
            <PrivateRoute module="users" />
          }
        >
          <Route
            path="/user-management"
            element={<UserManagement />}
          />
        </Route>

        {/* ================= ROLES ================= */}

        <Route
          element={
            <PrivateRoute module="roles" />
          }
        >
          <Route
            path="/roles-permissions"
            element={<RolesPermissions />}
          />
        </Route>

        <Route
          path="/roles"
          element={
            <Navigate
              to="/roles-permissions"
              replace
            />
          }
        />

        {/* ================= DEPARTMENTS ================= */}

        <Route
          element={
            <PrivateRoute module="departments" />
          }
        >
          <Route
            path="/departments"
            element={<Departmenttype />}
          />
        </Route>

        {/* ================= AUDIT LOG ================= */}

        <Route
          element={
            <PrivateRoute module="auditLogs" />
          }
        >
          <Route
            path="/audit-log"
            element={<AuditLog />}
          />
        </Route>

        {/* ================= ATS ================= */}

        <Route
          element={
            <PrivateRoute
              module="atsRanking"
              requires={["candidates"]}
            />
          }
        >
          <Route
            path="/ats-ranking"
            element={<ATSRanking />}
          />
        </Route>

        {/* ================= JOB REQUISITIONS ================= */}

        <Route
          element={
            <PrivateRoute module="jobRequisitions" />
          }
        >
          <Route
            path="/job-requisitions"
            element={<JobRequisition />}
          />
        </Route>

        {/* ================= CANDIDATE PIPELINE ================= */}

        <Route
          element={
            <PrivateRoute module="candidates"
            />
          }
        >
          <Route
            path="/candidate-pipeline"
            element={<CandidatePipeline />}
          />
        </Route>

        {/* ================= INTERVIEWS ================= */}

        <Route
          element={
            <PrivateRoute module="interviews" />
          }
        >
          <Route
            path="/interviews"
            element={<Interviews />}
          />
        </Route>

        {/* ================= MY INTERVIEWS ================= */}

        <Route
          element={
            <PrivateRoute interviewerOnly={true} />
          }
        >
          <Route
            path="/my-interviews"
            element={<Myinterviews />}
          />
        </Route>

        {/* ================= OFFER LETTERS ================= */}

        <Route
          element={
            <PrivateRoute module="offerLetters" />
          }
        >
          <Route
            path="/offer-letters"
            element={<OfferLetters />}
          />
        </Route>

        {/* ================= REPORT ================= */}

        <Route
          element={
            <PrivateRoute module="reports" />
          }
        >
          <Route
            path="/reports"
            element={<ReportsAnalytics />}
          />
        </Route>

      </Route>
    </Route>
  );
};

export default ProtectedRoutes;

