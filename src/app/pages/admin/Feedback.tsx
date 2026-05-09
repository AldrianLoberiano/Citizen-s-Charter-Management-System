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
  formatDateTime,
  Rating,
} from "../../store/data";

export function Feedback() {
  const [ratings, setRatings] = useState<Rating[]>(getRatings());

  useEffect(() => {
    setRatings(getRatings());
  }, []);

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
            Showing {sortedRatings.length} rating{sortedRatings.length === 1 ? "" : "s"}
          </p>
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
              {sortedRatings.map((rating) => {
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
              {sortedRatings.length === 0 && (
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
