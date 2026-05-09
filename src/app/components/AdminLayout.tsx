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
} from "lucide-react";
import { isAuthenticated, logout, getAuthUser } from "../store/data";
import { Modal } from "./Modal";

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
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const isActive = (path: string) => location.pathname === path;


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
              <button
                type="button"
                onClick={() => setIsBackupOpen(true)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors bg-white/10 text-white hover:bg-white/20"
              >
                <Database className="h-4 w-4" />
                Backup & Recovery
              </button>
            </nav>
          </div>

          {/* Header actions */}
          <div className="relative flex flex-shrink-0 items-center gap-2" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-white transition-colors hover:bg-white/20"
            >
              <span className="hidden text-sm capitalize sm:block">
                {currentUser || "admin"}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <User className="h-4 w-4 text-white" />
              </div>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Public Site
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <Modal
          isOpen={isBackupOpen}
          onClose={() => setIsBackupOpen(false)}
          title="Backup & Recovery"
          size="md"
        >
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              <p className="text-slate-900">Backup (mysqldump)</p>
              <pre className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
mysqldump -u root -p ccms_db &gt; backup_ccms_db.sql
              </pre>
            </div>
            <div>
              <p className="text-slate-900">Restore</p>
              <pre className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
mysql -u root -p ccms_db &lt; backup_ccms_db.sql
              </pre>
            </div>
            <p className="text-xs text-slate-500">
              Run these commands in a local terminal on the machine hosting MySQL.
            </p>
          </div>
        </Modal>

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
