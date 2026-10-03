import { NavLink } from "react-router-dom";

import {
  FaTableColumns,
  FaSuitcase,
  FaSliders,
  FaChartLine,
  FaCalendarDays,
  FaFileLines,
  FaClock,
  FaUsers,
  FaShield,
  FaBuilding,
} from "react-icons/fa6";

import { useAuth } from "../../context/useAuth";

const Sidebar = () => {
  const { user, logout } = useAuth();

  const userName = user?.name || "User";

  // =========================================
  // ROLE
  // =========================================

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

  // =========================================
  // PERMISSIONS
  // =========================================

  const permissions = Array.isArray(
    user?.role?.permissions
  )
    ? user.role.permissions
    : [];

  const canView = (module, requires = []) => {
    if (isSuperAdmin) {
      return true;
    }

    const modulesToCheck = [
      module,
      ...requires,
    ];

    return modulesToCheck.every(
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
  };

  // =========================================
  // RECRUITMENT
  // =========================================

  const recruitment = [
    {
      name: "Job Requisitions",
      icon: <FaSuitcase />,
      path: "/job-requisitions",
      module: "jobRequisitions",
    },
    {
      name: "Candidate Pipeline",
      icon: <FaSliders />,
      path: "/candidate-pipeline",
      module: "candidates",
    },
    {
      name: "ATS Ranking",
      icon: <FaChartLine />,
      path: "/ats-ranking",
      module: "atsRanking",
      requires: ["candidates"],
    },
    {
      name: "Interviews",
      icon: <FaCalendarDays />,
      path: "/interviews",
      module: "interviews",
    },
    {
      name: "Offer Letters",
      icon: <FaFileLines />,
      path: "/offer-letters",
      module: "offerLetters",
    },
    {
      name: "Report",
      icon: <FaClock />,
      path: "/reports",
      module: "reports",
    },
  ];

  // =========================================
  // ADMINISTRATION
  // =========================================

  const administration = [
    {
      name: "User Management",
      icon: <FaUsers />,
      path: "/user-management",
      module: "users",
    },
    {
      name: "Roles & Permissions",
      icon: <FaShield />,
      path: "/roles-permissions",
      module: "roles",
    },
    {
      name: "Departments & Types",
      icon: <FaBuilding />,
      path: "/departments",
      module: "departments",
    },
    {
      name: "Audit Log",
      icon: <FaClock />,
      path: "/audit-log",
      module: "auditLogs",
    },
  ];

  // =========================================
  // SIDEBAR VISIBILITY
  // =========================================

  const showDashboard =
    !isInterviewer &&
    canView("dashboard");

  /*
   * IMPORTANT:
   * Interviewer ke liye Recruitment ke
   * tamam items completely hide hain.
   */
  const visibleRecruitment =
    isInterviewer
      ? []
      : recruitment.filter((item) =>
          canView(
            item.module,
            item.requires || []
          )
        );

  /*
   * Interviewer ke liye Administration
   * completely hide hai.
   */
  const visibleAdministration =
    isInterviewer
      ? []
      : administration.filter((item) =>
          canView(item.module)
        );

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  // =========================================
  // UI
  // =========================================

  return (
    <aside className="flex h-screen w-63 flex-col overflow-y-auto bg-[#11131d] text-white">

      {/* LOGO */}
      <div className="flex items-center gap-2 p-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-md font-semibold">
          T
        </div>

        <div>
          <h2 className="text-md font-bold">
            Talenta
          </h2>

          <p className="text-xs text-gray-400">
            HR / ATS
          </p>
        </div>
      </div>

      <div className="flex-1 px-6">

        {/* OVERVIEW */}
        {showDashboard && (
          <>
            <p className="mb-2 flex text-[11px] uppercase text-gray-500">
              Overview
            </p>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `mb-2 flex items-center gap-3 rounded-lg p-1.5 text-sm font-semibold ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <FaTableColumns />
              Dashboard
            </NavLink>
          </>
        )}

        {/* MY WORK */}
        {isInterviewer && (
          <>
            <p className="mb-3 mt-3 flex text-[11px] font-semibold uppercase text-gray-500">
              My Work
            </p>

            <NavLink
              to="/my-interviews"
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-lg p-1.5 text-sm font-semibold ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <FaCalendarDays />
              My Interviews
            </NavLink>
          </>
        )}

        {/* RECRUITMENT */}
        {!isInterviewer &&
          visibleRecruitment.length > 0 && (
            <>
              <p className="mb-3 mt-3 flex text-[11px] font-semibold uppercase text-gray-500">
                Recruitment
              </p>

              {visibleRecruitment.map(
                (item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `mb-1 flex items-center gap-3 rounded-lg p-1.5 text-sm font-semibold ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-300 hover:bg-gray-800"
                      }`
                    }
                  >
                    {item.icon}
                    {item.name}
                  </NavLink>
                )
              )}
            </>
          )}

        {/* ADMINISTRATION */}
        {!isInterviewer &&
          visibleAdministration.length > 0 && (
            <>
              <p className="mb-1 mt-4 flex text-[11px] font-semibold uppercase text-gray-500">
                Administration
              </p>

              {visibleAdministration.map(
                (item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `mb-1 flex items-center gap-3 rounded-lg p-1.5 text-sm font-semibold ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-300 hover:bg-gray-800"
                      }`
                    }
                  >
                    {item.icon}
                    {item.name}
                  </NavLink>
                )
              )}
            </>
          )}

      </div>

      {/* USER */}
      <div className="border-t border-gray-800 p-6">
        <div className="flex items-center gap-3">

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="text-sm font-semibold">
              {userName}
            </h3>

            <p className="text-xs text-gray-400">
              {roleName || "No Role"}
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 text-xs text-gray-400 hover:text-white"
        >
          Log out →
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;