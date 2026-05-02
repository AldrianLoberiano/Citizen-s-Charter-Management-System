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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Overview of the Citizen's Charter Management System
          </p>
        </div>
        <div className="text-slate-400 text-sm flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString("en-PH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-all hover:border-slate-300 group"
          >
            <div
              className={`${stat.bgColor} p-3 rounded-xl flex-shrink-0 group-hover:opacity-90 transition-opacity`}
            >
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-500 text-xs truncate">{stat.label}</p>
              <p className="text-slate-900 text-2xl">{stat.value}</p>
              <p className="text-slate-400 text-xs truncate">
                {stat.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Charters Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-slate-900">Recent Charters</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Last {recentCharters.length} added or updated charters
            </p>
          </div>
          <Link
            to="/admin/charters"
            className="flex items-center gap-1 text-blue-700 hover:text-blue-900 text-sm transition-colors"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-slate-500 text-xs uppercase tracking-wide">
                  Charter Title
                </th>
                <th className="text-left px-6 py-3 text-slate-500 text-xs uppercase tracking-wide hidden md:table-cell">
                  Department
                </th>
                <th className="text-left px-6 py-3 text-slate-500 text-xs uppercase tracking-wide hidden sm:table-cell">
                  Date Added
                </th>
                <th className="text-left px-6 py-3 text-slate-500 text-xs uppercase tracking-wide w-24">
                  File
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentCharters.map((charter) => {
                const dept = getDepartmentById(charter.department_id);
                return (
                  <tr key={charter.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-900 text-sm">
                          {charter.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 text-sm hidden md:table-cell">
                      {dept?.name || (
                        <span className="text-red-400">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 text-sm hidden sm:table-cell">
                      {formatDate(charter.created_at)}
                    </td>
                    <td className="px-6 py-3.5">
                      {charter.file_path ? (
                        <span className="inline-flex items-center gap-1 text-green-700 text-xs bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                          <Paperclip className="w-3 h-3" /> Attached
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
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
