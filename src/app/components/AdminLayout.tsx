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
const adminHeaderBgSrc = new URL("../../public/images/header/header1.png", import.meta.url).href;

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
      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden min-h-0">
        {/* Top Header Bar */}
        <header
          className="relative flex flex-shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm"
          style={{
            backgroundImage: `url(${adminHeaderBgSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-slate-950/35" />
          <div className="flex items-center gap-2">
            <img
              src={adminLogoSrc}
              alt="Calauan City Seal"
              className="h-8 w-8 flex-shrink-0 object-contain"
            />
            <span className="hidden text-sm text-white sm:block">CCCMS Admin</span>
          </div>

          {/* Center Navigation */}
          <div className="relative flex-1 min-w-0">
            <nav className="hidden items-center justify-center gap-2 sm:flex">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={
                    `flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors ` +
                    (isActive(path)
                      ? "bg-white/15 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white")
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* User info */}
          <div className="relative flex flex-shrink-0 items-center gap-3">
            <button
              type="button"
              disabled={!feedbackUrl}
              onClick={() => feedbackUrl && window.open(feedbackUrl, "_blank", "noopener,noreferrer")}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <QrCode className="h-4 w-4" />
              Feedback QR
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Public Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-red-500/20 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="hidden text-sm capitalize text-white sm:block">
              {currentUser || "admin"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
