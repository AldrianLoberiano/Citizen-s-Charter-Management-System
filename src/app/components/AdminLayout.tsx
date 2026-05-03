/**
 * Admin Layout Component
 * Provides the sidebar navigation and main content area for the admin panel.
 * Automatically redirects to login if user is not authenticated.
 */

import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Building2,
  FileText,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Shield,
  User,
  QrCode,
} from "lucide-react";
import { isAuthenticated, logout, getAuthUser, getCharters } from "../store/data";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/departments", label: "Departments", icon: Building2 },
  { path: "/admin/charters", label: "Charters", icon: FileText },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  if (!isAuthenticated()) {
    return null;
  }

  const currentUser = getAuthUser();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const isActive = (path: string) => location.pathname === path;
  const firstCharter = getCharters()[0];
  const feedbackUrl =
    typeof window !== "undefined" && firstCharter
      ? `${window.location.origin}/charter/${firstCharter.id}#feedback-form`
      : "";

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
        `}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
          <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm leading-tight truncate">
              CCMS Admin
            </div>
            <div className="text-slate-400 text-xs">Citizens Charter</div>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="text-slate-500 text-xs uppercase px-3 mb-3 tracking-wider">
            Main Menu
          </p>
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                ${
                  isActive(path)
                    ? "bg-blue-700 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive(path) && <ChevronRight className="w-4 h-4" />}
            </Link>
          ))}

          <button
            type="button"
            disabled={!feedbackUrl}
            onClick={() => feedbackUrl && window.open(feedbackUrl, "_blank", "noopener,noreferrer")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <QrCode className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-left">Feedback QR Code</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-4 border-t border-slate-700 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ExternalLink className="w-5 h-5 flex-shrink-0" />
            <span>View Public Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb / Title */}
          <div className="flex-1 min-w-0">
            <span className="text-slate-500 text-sm hidden sm:block truncate">
              Citizen's Charter Management System — Admin Panel
            </span>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-700" />
            </div>
            <span className="text-slate-700 text-sm hidden sm:block capitalize">
              {currentUser || "admin"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
