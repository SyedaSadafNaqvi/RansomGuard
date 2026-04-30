// frontend/src/app/components/DashboardLayout.tsx

import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Database,
  Activity,
  FileCheck,
  Info,
  Menu,
  X,
  Shield,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Upload, label: "Upload File", path: "/dashboard/upload" },
  { icon: FileCheck, label: "Results", path: "/dashboard/results" },
  { icon: Activity, label: "Performance", path: "/dashboard/performance" },
  { icon: Database, label: "Dataset", path: "/dashboard/dataset" },
  { icon: Info, label: "About", path: "/dashboard/about" },
];

// Breadcrumb mapping
const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/upload": "Upload File",
  "/dashboard/results": "Detection Results",
  "/dashboard/performance": "Model Performance",
  "/dashboard/dataset": "Dataset Analysis",
  "/dashboard/about": "About Project",
};

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentPage = breadcrumbMap[location.pathname] || "Dashboard";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Mobile Menu Button */}
      <Button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#12121c] border border-[#00d9ff]/30 hover:border-[#00d9ff] p-2"
        size="icon"
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6 text-[#00d9ff]" />
        ) : (
          <Menu className="w-6 h-6 text-[#00d9ff]" />
        )}
      </Button>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || isDesktop) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3 }}
            className="fixed left-0 top-0 h-screen w-72 bg-[#0f0f18] border-r border-[#00d9ff]/15 z-40 flex flex-col"
          >
            {/* Logo */}
            <div className="p-6 border-b border-[#00d9ff]/15 flex-shrink-0">
              <div
                onClick={() => navigate("/")}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d9ff] to-[#00ffc8] flex items-center justify-center shadow-[0_0_20px_rgba(0,217,255,0.3)]">
                  <Shield className="w-6 h-6 text-[#0a0a0f]" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-white group-hover:text-[#00d9ff] transition-colors">
                    RansomGuard
                  </h2>
                  <p className="text-xs text-gray-500">Detection System</p>
                </div>
              </div>
            </div>

            {/* User Profile Placeholder */}
            <div className="px-6 py-4 border-b border-[#00d9ff]/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00d9ff]/30 to-[#00ffc8]/30 border border-[#00d9ff]/40 flex items-center justify-center text-sm font-bold text-[#00d9ff]">
                  R
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Researcher</p>
                  <p className="text-xs text-gray-500">Security Analyst</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 pb-32">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      if (window.innerWidth < 1024)
                        setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group relative ${
                      isActive
                        ? "bg-[#00d9ff]/10 text-[#00d9ff] shadow-[0_0_15px_rgba(0,217,255,0.15)]"
                        : "text-gray-400 hover:text-white hover:bg-[#1e1e2e]"
                    }`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00d9ff] to-[#00ffc8] rounded-r"
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <item.icon
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-[#00d9ff]"
                          : "group-hover:text-[#00d9ff]"
                      } transition-colors`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-[#00d9ff]/15 bg-[#0f0f18]">
              <div className="p-4 rounded-lg bg-[#12121c]/50 border border-[#00d9ff]/10">
                <p className="text-xs text-gray-400 mb-1">System Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00ffc8] animate-pulse shadow-[0_0_10px_rgba(0,255,200,0.5)]" />
                  <span className="text-sm text-white">
                    All Systems Online
                  </span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Breadcrumb Bar */}
        <div className="sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#00d9ff]/10">
          <div className="px-6 lg:px-8 py-3 flex items-center gap-2 text-sm">
            <span
              onClick={() => navigate("/dashboard")}
              className="text-gray-500 hover:text-[#00d9ff] cursor-pointer transition-colors"
            >
              Home
            </span>
            {location.pathname !== "/dashboard" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-[#00d9ff] font-medium">
                  {currentPage}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}