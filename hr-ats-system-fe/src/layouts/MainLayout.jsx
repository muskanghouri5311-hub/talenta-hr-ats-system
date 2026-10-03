import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen bg-[#f5f7fb] overflow-hidden">

      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen overflow-y-auto shrink-0">
        <Sidebar />
      </div>

      {/* Main Area */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">

        <Topbar toggle={toggleSidebar} />

        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>

      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={toggleSidebar}
          />

          {/* Sidebar */}
          <div className="relative h-full w-64 bg-white">
            <Sidebar />
          </div>
        </div>
      )}

    </div>
  );
};

export default MainLayout;