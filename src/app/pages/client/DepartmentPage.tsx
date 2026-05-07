/**
 * Department Page (Client-facing)
 * Displays all Citizen's Charters for a specific department
 */

import { useEffect, useState } from "react";
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

  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const deptId = parseInt(id || "0");
  const department = getDepartmentById(deptId);

  // Redirect if department not found
  if (!department) {
    return <Navigate to="/" replace />;
  }

  const bagongPilipinasLogo = new URL(
    "../../../public/images/header/Bagong_Pilipinas_logo.png",
    import.meta.url
  ).href;
  const calauanLogo2 = new URL(
    "../../../public/images/header/calauan_logo2.png",
    import.meta.url
  ).href;

  const allCharters = getChartersByDepartment(deptId);
  const charters = allCharters.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Department Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="relative mx-auto w-full px-6 py-10 sm:px-10 lg:px-16">
          <div className="mt-6 flex flex-col items-center gap-2 sm:absolute sm:right-4 sm:top-10 sm:mt-0">
            <div className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] text-slate-600 shadow-sm">
              {now.toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })} · {now.toLocaleTimeString()}
            </div>
            <div className="flex items-center justify-center gap-2">
              <img
                src={calauanLogo2}
                alt="Calauan logo"
                className="h-10 w-10 object-contain md:h-[120px] md:w-[120px]"
                loading="lazy"
                decoding="async"
              />
              <img
                src={bagongPilipinasLogo}
                alt="Bagong Pilipinas Logo"
                className="h-10 w-10 object-contain md:h-[120px] md:w-[120px]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="transition-colors hover:text-slate-900">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900">{department.name}</span>
          </nav>

          {/* Department Info */}
          <div className="flex items-start gap-4">
            <div>
              <h1 className="leading-tight text-slate-950">{department.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                {department.description || "No description available."}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
                <FileText className="h-4 w-4" />
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
      <section className="mx-auto w-full px-6 py-10 sm:px-10 lg:px-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-slate-950">Available Services</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Click on a service to view full details, requirements, and
              procedures
            </p>
          </div>

          {/* Back button */}
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            All Departments
          </Link>
        </div>

        {/* Search within department */}
        {allCharters.length > 3 && (
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-9 py-2.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        )}

        {/* Charter Cards Grid */}
        {charters.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {charters.map((charter) => (
              <Link
                key={charter.id}
                to={`/charter/${charter.id}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-sm"
              >
                {/* Top */}
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 transition-colors group-hover:bg-slate-200">
                    <FileText className="h-5 w-5 text-slate-500 transition-colors group-hover:text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="leading-snug text-slate-900 transition-colors group-hover:text-slate-950">
                      {charter.title}
                    </h3>
                  </div>
                </div>

                {/* Content preview */}
                <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-slate-500">
                  {charter.content.split("\n")[0]}
                </p>

                {/* Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(charter.created_at)}
                    </div>
                    {charter.file_path && (
                      <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        <Paperclip className="h-3 w-3" />
                        File attached
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-700 transition-all group-hover:gap-2">
                    <span>Read more</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h3 className="text-slate-500">
              {search ? "No services match your search" : "No services available"}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {search
                ? `Try a different keyword.`
                : "This department has not published any charters yet."}
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
