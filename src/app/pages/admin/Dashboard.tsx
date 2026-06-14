/**
 * Admin Dashboard Page
 * Displays system statistics and recent activity overview
 */

import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Building2,
  Database,
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
  getCombinedFeedback,
  formatDate,
} from "../../store/data";

export function Dashboard() {
  const [departments, setDepartments] = useState(getDepartments());
  const [charters, setCharters] = useState(getCharters());
  const [feedback, setFeedback] = useState(getCombinedFeedback());

  useEffect(() => {
    setDepartments(getDepartments());
    setCharters(getCharters());
    setFeedback(getCombinedFeedback());
  }, []);

  const recentCharters = [...charters]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 6);

  const attachmentCount = charters.filter((c) => c.file_path).length;
  const attachmentPct = charters.length > 0 ? Math.round((attachmentCount / charters.length) * 100) : 0;
  const feedbackPct = charters.length > 0 ? Math.round((feedback.length / charters.length) * 100) : 0;

  const stats = [
    {
      label: "Total Departments",
      value: departments.length,
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50",
      link: "/admin/departments",
      detail: `${departments.length} registered`,
      change: "Government units",
    },
    {
      label: "Total Charters",
      value: charters.length,
      icon: FileText,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      link: "/admin/charters",
      detail: `${charters.length} published`,
      change: "Active services",
    },
    {
      label: "With Attachments",
      value: attachmentCount,
      icon: Paperclip,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50",
      link: "/admin/charters",
      detail: `${attachmentPct}% of charters`,
      change: "Have PDF files",
    },
    {
      label: "Total Feedback",
      value: feedback.length,
      icon: Star,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/50",
      link: "/admin/feedback",
      detail: `${feedbackPct}% response rate`,
      change: "Citizen reviews",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="rounded-xl border-l-4 border-violet-900 bg-white dark:bg-slate-900 px-6 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-slate-900 dark:text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Overview of the Calauan Citizen's Charter Management System
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <Clock className="h-4 w-4" />
            {new Date().toLocaleDateString("en-PH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="group relative rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <div className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} transition-transform group-hover:scale-110`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="min-w-0 pr-10">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{stat.detail}</p>
            </div>
            <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.change}</p>
            </div>
          </Link>
        ) )}
        </div>

      {/* Recent Charters Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-slate-900 dark:text-white">Recent Charters</h2>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-400">
              Last {recentCharters.length} added or updated charters
            </p>
          </div>
          <Link
            to="/admin/charters"
            className="flex items-center gap-1 text-sm text-slate-700 transition-colors hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500">
                  Charter Title
                </th>
                <th className="hidden px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300 md:table-cell">
                  Department
                </th>
                <th className="hidden px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300 sm:table-cell">
                  Date Added
                </th>
                <th className="w-24 px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  File
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentCharters.map((charter) => {
                const dept = getDepartmentById(charter.department_id);
                return (
                  <tr key={charter.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                        <span className="text-sm text-slate-900 dark:text-slate-100">
                          {charter.title}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-6 py-3.5 text-sm text-slate-500 dark:text-slate-300 md:table-cell">
                      {dept?.name || (
                        <span className="text-red-400">Unknown</span>
                      )}
                    </td>
                    <td className="hidden px-6 py-3.5 text-sm text-slate-500 dark:text-slate-300 sm:table-cell">
                      {formatDate(charter.created_at)}
                    </td>
                    <td className="px-6 py-3.5">
                      {charter.file_path ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          <Paperclip className="h-3 w-3" /> Attached
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {recentCharters.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-400"
                  >
                    No charters have been added yet.{" "}
                    <Link
                      to="/admin/charters"
                      className="text-slate-700 transition-colors hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
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
    </div>
  );
}