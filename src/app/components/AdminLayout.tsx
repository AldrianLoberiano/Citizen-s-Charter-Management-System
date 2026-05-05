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
  User,
  QrCode,
} from "lucide-react";
import { isAuthenticated, logout, getAuthUser, getCharters } from "../store/data";

const adminLogoSrc = new URL("../../public/images/header/calauan_logo.png", import.meta.url).href;

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
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-800 bg-slate-950 text-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
        `}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
          <img
            src={adminLogoSrc}
            alt="Calauan City Seal"
            className="h-9 w-9 flex-shrink-0 object-contain"
          />
          <div className="min-w-0">
            <div className="truncate text-sm leading-tight text-white">
              CCCMS Admin
            </div>
            <div className="text-xs text-slate-400">Calauan Citizens Charter</div>
          </div>
          <button
            className="ml-auto rounded-lg p-1 text-slate-400 transition-colors hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 pb-28">
          <p className="mb-3 px-3 text-xs uppercase tracking-wider text-slate-500">
            Main Menu
          </p>
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={
                `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ` +
                (isActive(path)
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-white/8 hover:text-white")
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive(path) && <ChevronRight className="h-4 w-4" />}
            </Link>
          ))}

          <button
            type="button"
            disabled={!feedbackUrl}
            onClick={() => feedbackUrl && window.open(feedbackUrl, "_blank", "noopener,noreferrer")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-300 transition-colors hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <QrCode className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">Feedback QR Code</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="sticky bottom-0 space-y-1 border-t border-slate-800 bg-slate-950 px-3 py-4">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-300 transition-colors hover:bg-white/8 hover:text-white"
          >
            <ExternalLink className="h-5 w-5 flex-shrink-0" />
            <span>View Public Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-300 transition-colors hover:bg-red-500/15 hover:text-white"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 flex flex-shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          {/* Mobile hamburger */}
          <button
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb / Title */}
          <div className="flex-1 min-w-0">
            <span className="hidden truncate text-sm text-slate-500 sm:block">
              Citizen's Charter Management System — Admin Panel
            </span>
          </div>

          {/* User info */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <User className="h-4 w-4 text-slate-700" />
            </div>
            <span className="hidden text-sm capitalize text-slate-700 sm:block">
              {currentUser || "admin"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 pt-20 sm:p-6 sm:pt-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
