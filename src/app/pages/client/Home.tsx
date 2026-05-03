/**
 * Client Homepage
 * Displays all departments in a searchable grid layout
 * Public-facing page for citizens to browse available services
 */

import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Search,
  Building2,
  ChevronRight,
  FileText,
  Users,
  Shield,
  BookOpen,
} from "lucide-react";
import {
  getDepartments,
  getChartersByDepartment,
} from "../../store/data";

export function Home() {
  const [search, setSearch] = useState("");
  const departments = getDepartments();

  const filtered = useMemo(
    () =>
      departments.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.description.toLowerCase().includes(search.toLowerCase())
      ),
    [departments, search]
  );

  const totalCharters = departments.reduce(
    (acc, d) => acc + getChartersByDepartment(d.id).length,
    0
  );

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-blue-200 text-sm mb-4">
              <Shield className="w-4 h-4" />
              <span>Official Government Service Directory</span>
            </div>
            <h1 className="text-white text-3xl sm:text-4xl leading-tight mb-4">
              Citizen's Charter
            </h1>
            <p className="text-blue-100 text-base leading-relaxed mb-8">
              Access information on government services, requirements, processing
              times, and fees. Our Citizen's Charter ensures transparency and
              accountability in public service delivery.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search departments or services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-800 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-md"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-slate-300 text-sm">
                  {departments.length} Departments
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-green-400" />
              <span className="text-slate-300 text-sm">
                {totalCharters} Service Charters
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-amber-400" />
              <span className="text-slate-300 text-sm">
                Serving all registered residents
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-slate-900">
              {search ? `Search Results` : "Government Departments"}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {search ? (
                <>
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}{" "}
                  for "<strong>{search}</strong>"
                </>
              ) : (
                "Select a department to view available services and charters"
              )}
            </p>
          </div>
          {search && filtered.length > 0 && (
            <button
              onClick={() => setSearch("")}
              className="text-blue-700 hover:text-blue-900 text-sm"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Department Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((dept) => {
              const charterCount = getChartersByDepartment(dept.id).length;
              return (
                <Link
                  key={dept.id}
                  to={`/department/${dept.id}`}
                  className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all p-6 flex flex-col"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <Building2 className="w-6 h-6 text-blue-700" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-slate-900 group-hover:text-blue-800 transition-colors leading-tight mb-2">
                      {dept.name}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                      {dept.description || "No description available."}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>
                        {charterCount} charter{charterCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-700 text-sm group-hover:gap-2 transition-all">
                      <span>View</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-500">No departments found</h3>
            <p className="text-slate-400 text-sm mt-1">
              {search
                ? `No results for "${search}". Try a different keyword.`
                : "No departments have been registered yet."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-4 px-4 py-2 bg-blue-800 text-white rounded-lg text-sm hover:bg-blue-900 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </section>

      {/* Info Section */}
      <section className="bg-slate-100 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-slate-900 text-center mb-8">
            How to Use This Portal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Building2,
                step: "1",
                title: "Choose a Department",
                desc: "Browse through the list of government departments and select the office that handles the service you need.",
              },
              {
                icon: FileText,
                step: "2",
                title: "Find the Service",
                desc: "Inside each department, you'll see a list of available services with complete information on how to apply.",
              },
              {
                icon: Users,
                step: "3",
                title: "Prepare and Apply",
                desc: "Review the requirements, fees, and processing time, then visit the office or follow the steps to avail the service.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-xl border border-slate-200 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-800 text-white rounded-lg flex items-center justify-center text-sm">
                    {item.step}
                  </div>
                  <item.icon className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
