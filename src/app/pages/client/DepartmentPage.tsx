/**
 * Department Page (Client-facing)
 * Displays all Citizen's Charters for a specific department
 */

import { useState } from "react";
import { Link, useParams, Navigate } from "react-router";
import {
  ChevronRight,
  Building2,
  FileText,
  Paperclip,
  Clock,
  ArrowLeft,
  Search,
  BookOpen,
} from "lucide-react";
import {
  getDepartmentById,
  getChartersByDepartment,
  formatDate,
} from "../../store/data";

export function DepartmentPage() {
  const { id } = useParams<{ id: string }>();
  const [search, setSearch] = useState("");

  const deptId = parseInt(id || "0");
  const department = getDepartmentById(deptId);

  // Redirect if department not found
  if (!department) {
    return <Navigate to="/" replace />;
  }

  const allCharters = getChartersByDepartment(deptId);
  const charters = allCharters.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Department Hero */}
      <section className="bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-blue-200 text-sm mb-6">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white">{department.name}</span>
          </nav>

          {/* Department Info */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-blue-700 border border-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white leading-tight">{department.name}</h1>
              <p className="text-blue-100 text-sm mt-2 max-w-2xl leading-relaxed">
                {department.description || "No description available."}
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-blue-200 text-sm">
                <FileText className="w-4 h-4" />
                <span>
                  {allCharters.length} available service
                  {allCharters.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charters Section */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-slate-900">Available Services</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Click on a service to view full details, requirements, and
              procedures
            </p>
          </div>

          {/* Back button */}
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Departments
          </Link>
        </div>

        {/* Search within department */}
        {allCharters.length > 3 && (
          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Charter Cards Grid */}
        {charters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {charters.map((charter) => (
              <Link
                key={charter.id}
                to={`/charter/${charter.id}`}
                className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all p-6 flex flex-col"
              >
                {/* Top */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                    <FileText className="w-5 h-5 text-slate-500 group-hover:text-blue-700 transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-slate-900 group-hover:text-blue-800 transition-colors leading-snug">
                      {charter.title}
                    </h3>
                  </div>
                </div>

                {/* Content preview */}
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 flex-1">
                  {charter.content.split("\n")[0]}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(charter.created_at)}
                    </div>
                    {charter.file_path && (
                      <div className="flex items-center gap-1 text-green-700 text-xs bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        <Paperclip className="w-3 h-3" />
                        File attached
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-blue-700 text-sm group-hover:gap-2 transition-all">
                    <span>Read more</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-500">
              {search ? "No services match your search" : "No services available"}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {search
                ? `Try a different keyword.`
                : "This department has not published any charters yet."}
            </p>
          </div>
        )}
      </section>

      {/* Other Departments suggestion */}
      <section className="bg-slate-100 border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-slate-700">Looking for another service?</h3>
            <p className="text-slate-500 text-sm mt-0.5">
              Browse all departments to find the service you need.
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors text-sm whitespace-nowrap"
          >
            <Building2 className="w-4 h-4" />
            All Departments
          </Link>
        </div>
      </section>
    </div>
  );
}
