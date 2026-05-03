/**
 * Admin Dashboard Page
 * Displays system statistics and recent activity overview
 */

import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Building2,
  FileText,
  Paperclip,
  ChevronRight,
  Clock,
  Star,
  ArrowRight,
} from "lucide-react";
import {
  getDepartments,
  getCharters,
  getDepartmentById,
  getRatings,
  formatDate,
} from "../../store/data";

export function Dashboard() {
  const [departments, setDepartments] = useState(getDepartments());
  const [charters, setCharters] = useState(getCharters());
  const [ratings, setRatings] = useState(getRatings());

  useEffect(() => {
    setDepartments(getDepartments());
    setCharters(getCharters());
    setRatings(getRatings());
  }, []);

  const recentCharters = [...charters]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 6);

  const stats = [
    {
      label: "Total Departments",
      value: departments.length,
      icon: Building2,
      bgColor: "bg-blue-800",
      link: "/admin/departments",
      description: "Government departments",
    },
    {
      label: "Total Charters",
      value: charters.length,
      icon: FileText,
      bgColor: "bg-green-700",
      link: "/admin/charters",
      description: "Published service charters",
    },
    {
      label: "With Attachments",
      value: charters.filter((c) => c.file_path).length,
      icon: Paperclip,
      bgColor: "bg-amber-600",
      link: "/admin/charters",
      description: "Charters with files",
    },
    {
      label: "Total Feedback",
      value: ratings.length,
      icon: Star,
      bgColor: "bg-purple-700",
      link: "/admin/dashboard",
      description: "Citizen ratings received",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Overview of the Citizen's Charter Management System
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-400">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString("en-PH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm"
          >
            <div
              className="flex-shrink-0 rounded-xl bg-slate-900 p-3 transition-opacity group-hover:opacity-90"
            >
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-500">{stat.label}</p>
              <p className="text-2xl text-slate-900">{stat.value}</p>
              <p className="truncate text-xs text-slate-400">
                {stat.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Charters Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-slate-900">Recent Charters</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Last {recentCharters.length} added or updated charters
            </p>
          </div>
          <Link
            to="/admin/charters"
            className="flex items-center gap-1 text-sm text-slate-700 transition-colors hover:text-slate-950"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500">
                  Charter Title
                </th>
                <th className="hidden px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500 md:table-cell">
                  Department
                </th>
                <th className="hidden px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500 sm:table-cell">
                  Date Added
                </th>
                <th className="w-24 px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500">
                  File
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentCharters.map((charter) => {
                const dept = getDepartmentById(charter.department_id);
                return (
                  <tr key={charter.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        <span className="text-sm text-slate-900">
                          {charter.title}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-6 py-3.5 text-sm text-slate-500 md:table-cell">
                      {dept?.name || (
                        <span className="text-red-400">Unknown</span>
                      )}
                    </td>
                    <td className="hidden px-6 py-3.5 text-sm text-slate-500 sm:table-cell">
                      {formatDate(charter.created_at)}
                    </td>
                    <td className="px-6 py-3.5">
                      {charter.file_path ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          <Paperclip className="h-3 w-3" /> Attached
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {recentCharters.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-400 text-sm"
                  >
                    No charters have been added yet.{" "}
                    <Link
                      to="/admin/charters"
                      className="text-blue-700 hover:underline"
                    >
                      Add the first charter
                    </Link>
                    .
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/departments"
          className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between hover:shadow-md transition-all hover:border-blue-200 group"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-700" />
            <div>
              <p className="text-slate-900">Manage Departments</p>
              <p className="text-slate-400 text-xs">Add, edit, or remove departments</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition-colors" />
        </Link>
        <Link
          to="/admin/charters"
          className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between hover:shadow-md transition-all hover:border-blue-200 group"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-green-700" />
            <div>
              <p className="text-slate-900">Manage Charters</p>
              <p className="text-slate-400 text-xs">Create, edit, or delete charters</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-green-700 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
