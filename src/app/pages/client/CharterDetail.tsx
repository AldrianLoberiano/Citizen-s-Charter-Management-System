/**
 * Charter Detail Page (Client-facing)
 * Displays full charter information including content, file download, QR code,
 * and citizen feedback/rating system
 */

import { useState } from "react";
import { Link, useParams, Navigate } from "react-router";
import {
  ChevronRight,
  Building2,
  FileText,
  Download,
  Clock,
  Star,
  Send,
  CheckCircle,
  QrCode,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import {
  getCharterById,
  getDepartmentById,
  getRatingsByCharter,
  getAverageRating,
  addRating,
  formatDate,
  formatDateTime,
  Rating,
} from "../../store/data";

export function CharterDetail() {
  const { id } = useParams<{ id: string }>();
  const charterId = parseInt(id || "0");

  const charter = getCharterById(charterId);
  const [ratings, setRatings] = useState<Rating[]>(
    getRatingsByCharter(charterId)
  );
  const [avgRating, setAvgRating] = useState(getAverageRating(charterId));

  // Rating form state
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showQr, setShowQr] = useState(false);

  // Redirect if charter not found
  if (!charter) {
    return <Navigate to="/" replace />;
  }

  const department = getDepartmentById(charter.department_id);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(currentUrl)}&bgcolor=ffffff&color=1e3a8a`;
  // Format content with line breaks preserved
  const formattedContent = charter.content.split("\n").map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={idx} />;

    // Section headers (all caps lines)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith("-")) {
      return (
        <p key={idx} className="text-slate-800 mt-4 mb-1">
          {trimmed}
        </p>
      );
    }

    // Bullet points
    if (trimmed.startsWith("-")) {
      return (
        <li key={idx} className="text-slate-600 text-sm leading-relaxed ml-4">
          {trimmed.slice(1).trim()}
        </li>
      );
    }

    // Numbered items
    if (/^\d+\./.test(trimmed)) {
      return (
        <li
          key={idx}
          className="text-slate-600 text-sm leading-relaxed ml-4 list-decimal"
        >
          {trimmed.replace(/^\d+\.\s*/, "")}
        </li>
      );
    }

    return (
      <p key={idx} className="text-slate-600 text-sm leading-relaxed">
        {trimmed}
      </p>
    );
  });

  // Submit rating
  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (selectedStar === 0) {
      setSubmitError("Please select a star rating before submitting.");
      return;
    }

    const newRating = addRating({
      charter_id: charterId,
      rating: selectedStar,
      comment: comment.trim(),
    });

    const updatedRatings = [...ratings, newRating];
    setRatings(updatedRatings);
    setAvgRating(
      Math.round(
        (updatedRatings.reduce((a, r) => a + r.rating, 0) /
          updatedRatings.length) *
          10
      ) / 10
    );
    setSubmitted(true);
  };

  const starLabel = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div>
      {/* Header */}
      <section className="bg-blue-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-blue-200 text-sm mb-6 flex-wrap">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {department && (
              <>
                <Link
                  to={`/department/${department.id}`}
                  className="hover:text-white transition-colors"
                >
                  {department.name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            <span className="text-white truncate max-w-xs">{charter.title}</span>
          </nav>

          {/* Title */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-700 border border-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white leading-tight">{charter.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {department && (
                  <div className="flex items-center gap-1.5 text-blue-200 text-sm">
                    <Building2 className="w-4 h-4" />
                    {department.name}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-blue-200 text-sm">
                  <Clock className="w-4 h-4" />
                  Published {formatDate(charter.created_at)}
                </div>
                {ratings.length > 0 && (
                  <div className="flex items-center gap-1 text-amber-300 text-sm">
                    <Star className="w-4 h-4 fill-amber-300" />
                    {avgRating} ({ratings.length} review
                    {ratings.length !== 1 ? "s" : ""})
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charter Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <FileText className="w-5 h-5 text-blue-700" />
                <h2 className="text-slate-900">Service Information</h2>
              </div>

              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 text-xs text-slate-400">
                  <span>Service details</span>
                  <span>Published {formatDate(charter.created_at)}</span>
                </div>

                <div className="space-y-3">
                  {formattedContent}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                  <span>Citizen's Charter Management System</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <MessageSquare className="w-5 h-5 text-blue-700" />
                <h2 className="text-slate-900">Citizen Feedback</h2>
              </div>

              {submitted ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p>Thank you for your feedback!</p>
                    <p className="text-green-600 text-sm mt-0.5">
                      Your rating has been submitted and helps improve our
                      services.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitRating} className="space-y-4">
                  {/* Star Rating */}
                  <div>
                    <label className="block text-slate-700 mb-2 text-sm">
                      Rate this service
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSelectedStar(star)}
                          onMouseEnter={() => setHoverStar(star)}
                          onMouseLeave={() => setHoverStar(0)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              star <= (hoverStar || selectedStar)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                      {(hoverStar || selectedStar) > 0 && (
                        <span className="ml-2 text-slate-600 text-sm">
                          {starLabel[hoverStar || selectedStar]}
                        </span>
                      )}
                    </div>
                    {submitError && (
                      <p className="text-red-600 text-xs mt-1">{submitError}</p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-slate-700 mb-1.5 text-sm">
                      Comment{" "}
                      <span className="text-slate-400 text-xs">(optional)</span>
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this service..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="text-slate-400 text-xs text-right mt-1">
                      {comment.length}/500
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </button>
                </form>
              )}

              {/* Existing Ratings */}
              {ratings.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-700">
                      Reviews ({ratings.length})
                    </h3>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span className="text-slate-700">{avgRating} / 5</span>
                    </div>
                  </div>

                  {/* Rating distribution */}
                  <div className="space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratings.filter(
                        (r) => r.rating === star
                      ).length;
                      const pct =
                        ratings.length > 0
                          ? Math.round((count / ratings.length) * 100)
                          : 0;
                      return (
                        <div
                          key={star}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="text-slate-500 w-3">{star}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-slate-400 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Comment list */}
                  <div className="space-y-3 mt-4">
                    {ratings
                      .filter((r) => r.comment)
                      .slice(-5)
                      .reverse()
                      .map((r) => (
                        <div
                          key={r.id}
                          className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= r.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-slate-400 text-xs">
                              {formatDateTime(r.created_at)}
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm">{r.comment}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* QR Code */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-slate-900 mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-slate-500" />
                QR Code
              </h3>
              <p className="text-slate-500 text-xs mb-3">
                Scan to access this charter on a mobile device
              </p>
              {showQr ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={qrUrl}
                    alt="QR Code for this charter"
                    className="w-40 h-40 border border-slate-200 rounded-lg"
                  />
                  <button
                    onClick={() => setShowQr(false)}
                    className="text-slate-500 text-xs hover:text-slate-700"
                  >
                    Hide QR Code
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowQr(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  <QrCode className="w-4 h-4" />
                  Show QR Code
                </button>
              )}
            </div>

            {/* Charter Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-slate-900 mb-3">Charter Details</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                    Department
                  </dt>
                  <dd className="text-slate-700">
                    {department ? (
                      <Link
                        to={`/department/${department.id}`}
                        className="text-blue-700 hover:underline flex items-center gap-1"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        {department.name}
                      </Link>
                    ) : (
                      "Unknown"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                    Charter ID
                  </dt>
                  <dd className="text-slate-700">#{charter.id}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                    Date Published
                  </dt>
                  <dd className="text-slate-700">
                    {formatDate(charter.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                    Citizen Ratings
                  </dt>
                  <dd className="text-slate-700">
                    {ratings.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>
                          {avgRating} / 5 ({ratings.length} review
                          {ratings.length !== 1 ? "s" : ""})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">No ratings yet</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              {department && (
                <Link
                  to={`/department/${department.id}`}
                  className="w-full flex items-center gap-2 py-2.5 px-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to {department.name}
                </Link>
              )}
              <Link
                to="/"
                className="w-full flex items-center gap-2 py-2.5 px-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-sm"
              >
                <Building2 className="w-4 h-4" />
                All Departments
              </Link>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.print();
                }}
                className="w-full flex items-center gap-2 py-2.5 px-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-sm"
              >
                <ThumbsUp className="w-4 h-4" />
                Print this Charter
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
