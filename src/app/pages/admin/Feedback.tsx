/**
 * Admin Feedback Page
 * Displays citizen ratings and comments submitted on charters.
 */

import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Star } from "lucide-react";
import {
  getRatings,
  getCharterById,
  getDepartmentById,
  getCharters,
  getDepartments,
  formatDateTime,
  Rating,
} from "../../store/data";

export function Feedback() {
  const [ratings, setRatings] = useState<Rating[]>(getRatings());
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [charterFilter, setCharterFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const feedbackFormUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSfkaEz1PHp1yvtvrB9hWpa7YuxZE-AD3lT_C9wGocdUM3_Q8Q/viewform";
  const feedbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
    feedbackFormUrl
  )}&bgcolor=ffffff&color=1e3a8a`;

  useEffect(() => {
    setRatings(getRatings());
  }, []);

  const departments = useMemo(() => getDepartments(), []);
  const charters = useMemo(() => getCharters(), []);

  const sortedRatings = useMemo(() => {
    return [...ratings].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [ratings]);

  const summary = useMemo(() => {
    if (ratings.length === 0) {
      return { total: 0, average: 0 };
    }
    const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const average = Math.round((total / ratings.length) * 10) / 10;
    return { total: ratings.length, average };
  }, [ratings]);

  const filteredRatings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return sortedRatings.filter((rating) => {
      const charter = getCharterById(rating.charter_id);
      const department = charter
        ? getDepartmentById(charter.department_id)
        : undefined;

      if (
        departmentFilter !== "all" &&
        String(department?.id ?? "") !== departmentFilter
      ) {
        return false;
      }

      if (charterFilter !== "all" && String(charter?.id ?? "") !== charterFilter) {
        return false;
      }

      if (ratingFilter !== "all" && String(rating.rating) !== ratingFilter) {
        return false;
      }

      if (normalizedSearch) {
        const haystack = `${charter?.title ?? ""} ${department?.name ?? ""} ${
          rating.comment ?? ""
        }`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [
    sortedRatings,
    departmentFilter,
    charterFilter,
    ratingFilter,
    searchTerm,
  ]);

  const clearFilters = () => {
    setDepartmentFilter("all");
    setCharterFilter("all");
    setRatingFilter("all");
    setSearchTerm("");
  };

  const handleExportCsv = () => {
    const rows = filteredRatings.map((rating) => {
      const charter = getCharterById(rating.charter_id);
      const department = charter ? getDepartmentById(charter.department_id) : undefined;
      return {
        charter: charter?.title ?? "Unknown charter",
        department: department?.name ?? "—",
        rating: rating.rating,
        comment: rating.comment?.trim() ?? "",
        date: formatDateTime(rating.created_at),
      };
    });

    const escapeValue = (value: string | number) => {
      const stringValue = String(value ?? "");
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const header = ["Charter", "Department", "Rating", "Comment", "Date"].join(",");
    const body = rows
      .map((row) =>
        [
          escapeValue(row.charter),
          escapeValue(row.department),
          escapeValue(row.rating),
          escapeValue(row.comment),
          escapeValue(row.date),
        ].join(",")
      )
      .join("\n");

    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `feedback_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-slate-900">Feedback</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Citizen ratings and comments submitted per charter.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <MessageSquare className="h-4 w-4" />
          {summary.total} total ratings
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Average Rating</p>
          <div className="mt-3 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            <span className="text-2xl text-slate-900">{summary.average}</span>
            <span className="text-sm text-slate-500">/ 5</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Feedback</p>
          <div className="mt-3 text-2xl text-slate-900">{summary.total}</div>
          <p className="mt-1 text-sm text-slate-500">All submitted ratings</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-slate-900">Latest Feedback</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Showing {filteredRatings.length} of {sortedRatings.length} rating
            {sortedRatings.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">
                Department
              </label>
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={String(dept.id)}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">
                Charter
              </label>
              <select
                value={charterFilter}
                onChange={(event) => setCharterFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All charters</option>
                {charters.map((charter) => (
                  <option key={charter.id} value={String(charter.id)}>
                    {charter.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">
                Rating
              </label>
              <select
                value={ratingFilter}
                onChange={(event) => setRatingFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All ratings</option>
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={String(value)}>
                    {value} star{value === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 xl:col-span-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search charter, department, or comment"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              Export CSV
            </button>
            <a
              href={feedbackFormUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              <img
                src={feedbackQrUrl}
                alt="QR code for feedback form"
                className="h-6 w-6 rounded"
              />
              Feedback Form QR
            </a>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-slate-500 transition-colors hover:text-slate-900"
            >
              Clear filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500">
                  Charter
                </th>
                <th className="hidden px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500 md:table-cell">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500">
                  Rating
                </th>
                <th className="hidden px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500 sm:table-cell">
                  Comment
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRatings.map((rating) => {
                const charter = getCharterById(rating.charter_id);
                const department = charter
                  ? getDepartmentById(charter.department_id)
                  : undefined;

                return (
                  <tr key={rating.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-3.5 text-sm text-slate-900">
                      {charter?.title || "Unknown charter"}
                    </td>
                    <td className="hidden px-6 py-3.5 text-sm text-slate-500 md:table-cell">
                      {department?.name || "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                        <Star className="h-3 w-3" />
                        {rating.rating}
                      </span>
                    </td>
                    <td className="hidden px-6 py-3.5 text-sm text-slate-500 sm:table-cell">
                      {rating.comment?.trim() || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-500">
                      {formatDateTime(rating.created_at)}
                    </td>
                  </tr>
                );
              })}
              {filteredRatings.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-slate-400"
                  >
                    No feedback has been submitted yet.
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
