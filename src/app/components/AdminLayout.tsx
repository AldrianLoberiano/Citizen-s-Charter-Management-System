/**
 * Admin Layout Component
 * Provides the sidebar navigation and main content area for the admin panel.
 * Automatically redirects to login if user is not authenticated.
 */

import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Building2,
  FileText,
  LogOut,
  ExternalLink,
  User,
  MessageSquare,
  Database,
  ChevronDown,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { Modal } from "./Modal";
import { isAuthenticated, logout, getAuthUser } from "../store/data";

const adminLogoSrc = new URL("../../public/images/header/logo.png", import.meta.url).href;
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
  { path: "/admin/feedback", label: "Feedback", icon: MessageSquare },
];

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("ccms_admin_theme");
    return stored ? stored === "dark" : false;
  });
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (!authenticated) {
      navigate("/admin/login", { replace: true });
    }
  }, [authenticated, navigate]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem("ccms_admin_theme", isDark ? "dark" : "light");
  }, [isDark]);

  const currentUser = getAuthUser();
  const displayName = currentUser ? currentUser.split("@")[0] : "Admin";

  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (!mobileNavRef.current) return;
      if (!mobileNavRef.current.contains(event.target as Node)) {
        setMobileNavOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setLogoutOpen(true);
  };

  const confirmLogout = () => {
    setLogoutOpen(false);
    logout();
    navigate("/admin/login");
  };

  const isActive = (path: string) => location.pathname === path;

  if (!authenticated) {
    return null;
  }


  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 dark:text-white">
      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden min-h-0">
        {/* Top Header Bar */}
        <header
          className="relative flex flex-shrink-0 items-center gap-4 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm dark:shadow-slate-800/50"
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
              className="h-15 w-20 flex-shrink-0 object-contain drop-shadow"
            />
            <div className="hidden text-white drop-shadow sm:block">
              <div className="text-sm leading-tight">Calauan Citizen's Charter</div>
              <div className="text-xs text-white/90">Municipality of Calauan</div>
            </div>
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

          {/* Header actions */}
          <div className="relative flex flex-shrink-0 items-center gap-2" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full bg-white/10 pl-2.5 pr-1.5 py-1 text-white transition-colors hover:bg-white/20"
            >
              <span className="hidden text-sm font-medium sm:block">
                {displayName}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/80">
                <User className="h-4 w-4 text-white" />
              </div>
              <ChevronDown className={`hidden h-3.5 w-3.5 text-white/70 transition-transform sm:block ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
                <div className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser || "admin@calauan.gov"}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    View Public Site
                  </Link>
                  <Link
                    to="/admin/backup"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Database className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    Backup & Recovery
                  </Link>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {mobileNavOpen && (
            <div
              ref={mobileNavRef}
              className="absolute left-0 right-0 top-full z-30 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 px-4 py-3 shadow-lg backdrop-blur-sm sm:hidden"
            >
              <nav className="flex flex-col gap-2">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileNavOpen(false)}
                    className={
                      `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ` +
                      (isActive(path)
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </header>


        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex-row">
            <p>&copy; 2026 Calauan Citizen's Charter Management System (CCMS). All rights reserved.</p>
            <p>
              In compliance with the <span className="font-medium text-slate-700 dark:text-slate-300">Data Privacy Act of 2012 (RA 10173)</span>.
            </p>
          </div>
        </footer>
      </div>

      <Modal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Confirm Logout"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to logout?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setLogoutOpen(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 transition-colors hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmLogout}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}