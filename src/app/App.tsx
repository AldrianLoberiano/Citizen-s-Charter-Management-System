/**
 * Citizen's Charter Management System
 * Main application entry point
 *
 * Tech Stack Simulation:
 * - Frontend: React + Tailwind CSS (replaces HTML + Tailwind + vanilla JS)
 * - Data Layer: localStorage (simulates PHP + MySQL backend)
 * - Routing: React Router (simulates PHP GET parameter routing)
 * - File Storage: Simulated (in production: Apache + /uploads/charters/ folder)
 *
 * Default Credentials: admin / admin123
 */

import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  useEffect(() => {
  return <RouterProvider router={router} />;
}
