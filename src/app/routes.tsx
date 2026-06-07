/**
 * Application Routes
 * Configured using React Router v7 Data Mode
 * Equivalent to PHP's routing via GET parameters in a procedural structure
 */

import { createBrowserRouter, Navigate } from "react-router";
import { AdminLayout } from "./components/AdminLayout";
import { ClientLayout } from "./components/ClientLayout";
import { Login } from "./pages/admin/Login";
import { Dashboard } from "./pages/admin/Dashboard";
import { Departments } from "./pages/admin/Departments";
import { Charters } from "./pages/admin/Charters";
import { Feedback } from "./pages/admin/Feedback";
import { BackupRecovery } from "./pages/admin/BackupRecovery";
import { Home } from "./pages/client/Home";
import { DepartmentPage } from "./pages/client/DepartmentPage";
import { CharterDetail } from "./pages/client/CharterDetail";

export const router = createBrowserRouter([
  // =========================================================
  // CLIENT / PUBLIC ROUTES
  // =========================================================
  {
    path: "/",
    element: <ClientLayout />,
    children: [
      {
        index: true,
      },
      {
        path: "department/:id",
        Component: DepartmentPage,
      },
      {
        path: "charter/:id",
        Component: CharterDetail,
      },
    ],
  },

  // =========================================================
  // ADMIN LOGIN
  // =========================================================
  {
    path: "/admin/login",
    Component: Login,
  },

  // =========================================================
  // ADMIN PANEL ROUTES (protected by AdminLayout auth check)
  // =========================================================
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: "dashboard",
        Component: Dashboard,
      },
      {
        path: "departments",
        Component: Departments,
      },
      {
        path: "charters",
        Component: Charters,
      },
      {
        path: "feedback",
        Component: Feedback,
      },
      {
        path: "backup",
        Component: BackupRecovery,
      },
    ],
  },

  // =========================================================
  // 404 / CATCH-ALL
  // =========================================================
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
