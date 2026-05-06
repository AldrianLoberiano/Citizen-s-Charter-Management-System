/**
 * Client Homepage
 * Displays all departments in a searchable grid layout
 * Public-facing page for citizens to browse available services
 */

import { useState, useMemo, useEffect } from "react";
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
import LogoLoop from "../../components/LogoLoop";

const bagongPilipinasLogoSrc = new URL(
  "../../../public/images/header/Bagong_Pilipinas_logo.png",
  import.meta.url
).href;
const calauanLogo2Src = new URL(
  "../../../public/images/header/calauan_logo2.png",
  import.meta.url
).href;
const lightVioletBgSrc = new URL(
  "../../../public/images/header/lightviolet.png",
  import.meta.url
).href;

export function Home() {
  const [search, setSearch] = useState("");
  const departments = getDepartments();

  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = now.toLocaleTimeString();

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
      <section className="border-b border-slate-200 bg-white">
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700">
                <Shield className="h-4 w-4" />
                <span>Official Government Service Directory</span>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl leading-tight text-slate-950 sm:text-4xl">
                Calauan Citizen's Charter
              </h1>
            </div>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-slate-600">
              Access information on government services, requirements, processing
              times, and fees. Our Citizen's Charter ensures transparency and
              accountability in public service delivery.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full max-w-lg">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search departments or services..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-12 py-3.5 text-slate-800 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="absolute right-4 top-16 flex flex-col items-center gap-2 sm:top-20">
            <div className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
              {formattedDate} · {formattedTime}
            </div>
            <div className="flex items-center justify-center gap-2">
              <img
                src={calauanLogo2Src}
                alt="Calauan logo"
                className="h-12 w-12 object-contain md:h-[160px] md:w-[160px]"
                loading="lazy"
                decoding="async"
              />
              <img
                src={bagongPilipinasLogoSrc}
                alt="Bagong Pilipinas logo"
                className="h-12 w-12 object-contain md:h-[160px] md:w-[160px]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner (moved here to sit above the logo loop) */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Departments</p>
                  <p className="text-xl text-slate-900">{departments.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Service Charters</p>
                  <p className="text-xl text-slate-900">{totalCharters}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Coverage</p>
                  <p className="text-xl text-slate-900">Residents served</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo loop (reverted position) */}
      <LogoLoop />

      {/* Logo loop (moved down) */}

      

      {/* Departments Section */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-slate-950">
              {search ? `Search Results` : "Government Departments"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
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
              className="text-sm text-slate-700 transition-colors hover:text-slate-950"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Department Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((dept) => {
              const charterCount = getChartersByDepartment(dept.id).length;
              return (
                <Link
                  key={dept.id}
                  to={`/department/${dept.id}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 p-6 transition-all hover:border-slate-300 hover:shadow-sm"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.35)), url(${lightVioletBgSrc})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Icon */}
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 transition-colors group-hover:bg-slate-200">
                    <Building2 className="h-6 w-6 text-slate-700" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-xl bg-white/85 p-3 shadow-sm backdrop-blur">
                    <h3 className="mb-2 leading-tight text-slate-900 transition-colors group-hover:text-slate-950">
                      {dept.name}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {dept.description || "No description available."}
                    </p>
                  </div>

                  {/* Footer */}
                      <FileText className="h-4 w-4 text-slate-300" />
                      <span>
                        {charterCount} charter{charterCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-100 transition-all group-hover:gap-2">
                      <span>View</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h3 className="text-slate-500">No departments found</h3>
            <p className="mt-1 text-sm text-slate-400">
              {search
                ? `No results for "${search}". Try a different keyword.`
                : "No departments have been registered yet."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </section>

      {/* Info Section */}
      <section className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-slate-950">
            How to Use This Portal
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm text-white">
                    {item.step}
                  </div>
                  <item.icon className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="mb-2 text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">
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
