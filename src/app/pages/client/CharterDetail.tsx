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
  ExternalLink,
  Clock,
  Star,
  Send,
  CheckCircle,
  QrCode,
  MessageSquare,
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

  // Redirect if charter not found
  if (!charter) {
    return <Navigate to="/" replace />;
  }

  const department = getDepartmentById(charter.department_id);
  const feedbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/charter/${charter.id}#feedback-form`
      : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(feedbackUrl)}&bgcolor=ffffff&color=1e3a8a`;
  const attachmentUrl = charter.file_path
    ? charter.file_path.startsWith("/")
      ? charter.file_path
      : charter.file_path.startsWith("uploads/")
        ? `/${charter.file_path}`
        : `/uploads/charters/${charter.file_path}`
    : "/charter-viewer.pdf";

  const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(
    /\/api$/,
    ""
  );

  const resolveFileUrl = (filePath: string) => {
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
    if (filePath.startsWith("/")) return `${FILE_BASE}${filePath}`;
    return `${FILE_BASE}/${filePath}`;
  };

  type ViewerType = "pdf" | "excel" | "unknown";

  const getViewerType = (filePath: string): ViewerType => {
    const lower = filePath.toLowerCase();
    if (lower.endsWith(".pdf")) return "pdf";
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "excel";
    return "unknown";
  };

  const viewerType = getViewerType(attachmentUrl);
  const resolvedAttachmentUrl = resolveFileUrl(attachmentUrl);

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

  const normalizedAttachmentPath = attachmentUrl.startsWith("/")
    ? attachmentUrl
    : attachmentUrl.startsWith("uploads/")
      ? `/${attachmentUrl}`
      : "";
  const excelPreviewUrl = normalizedAttachmentPath
    ? `${FILE_BASE}/api/previews/excel?file=${encodeURIComponent(normalizedAttachmentPath)}`
    : "";

  const handleDownload = () => {
    window.open(resolvedAttachmentUrl, "_blank", "noopener,noreferrer");
  };

  // Submit rating
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (selectedStar === 0) {
      setSubmitError("Please select a star rating before submitting.");
      return;
    }

    try {
      const newRating = await addRating({
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
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit rating.");
    }
  };

  const starLabel = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div>
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full px-6 py-10 sm:px-10 lg:px-16">
          {/* Breadcrumb */}
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="transition-colors hover:text-slate-900">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            {department && (
              <>
                <Link
                  to={`/department/${department.id}`}
                  className="transition-colors hover:text-slate-900"
                >
                  {department.name}
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
            <span className="max-w-xs truncate text-slate-900">{charter.title}</span>
          </nav>

          {/* Title */}
          <div className="flex items-start gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-slate-950 normal-case break-words">
                {charter.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                {department && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Building2 className="h-4 w-4" />
                    {department.name}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  Published {formatDate(charter.created_at)}
                </div>
                {ratings.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-amber-600">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
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
      <div className="mx-auto w-full px-6 py-10 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Charter Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-700" />
                <h2 className="text-slate-900">Service Information</h2>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 text-xs text-slate-400">
                  <span>Service details</span>
                  <span>Published {formatDate(charter.created_at)}</span>
                </div>

                <div className="space-y-3">
                  {formattedContent}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                  <span>Calauan Citizen's Charter Management System</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            </div>

            {/* File Viewer */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div>
                  <h3 className="text-slate-900">
                    {viewerType === "excel" ? "Excel Viewer" : "PDF Viewer"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    View the attached charter document
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Full Page
                </button>
              </div>
              <div className="bg-white p-3">
                {viewerType === "excel" && excelPreviewUrl && (
                  <iframe
                    src={excelPreviewUrl}
                    title={`${charter.title} Excel preview`}
                    className="h-[720px] w-full rounded-lg border border-slate-200 bg-white"
                  />
                )}
                {viewerType === "excel" && !excelPreviewUrl && (
                  <div className="p-4 text-sm text-slate-500">
                    Excel preview is not available for this file. Use View Full Page to
                    download it.
                  </div>
                )}
                {viewerType === "pdf" && (
                  <iframe
                    src={resolvedAttachmentUrl}
                    title={`${charter.title} PDF preview`}
                    className="h-[720px] w-full rounded-lg border border-slate-200 bg-white"
                  />
                )}
                {viewerType === "unknown" && (
                  <div className="p-4 text-sm text-slate-500">
                    No preview available for this file type. Use View Full Page to open it.
                  </div>
                )}
              </div>
            </div>

            {/* Feedback Section */}
            <div id="feedback-form" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-slate-700" />
                <h2 className="text-slate-900">Citizen Feedback</h2>
              </div>

              {submitted ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p>Thank you for your feedback!</p>
                    <p className="mt-0.5 text-sm text-emerald-600">
                      Your rating has been submitted and helps improve our
                      services.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitRating} className="space-y-4">
                  {/* Star Rating */}
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">
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
                            className={`h-7 w-7 transition-colors ${
                              star <= (hoverStar || selectedStar)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                      {(hoverStar || selectedStar) > 0 && (
                        <span className="ml-2 text-sm text-slate-600">
                          {starLabel[hoverStar || selectedStar]}
                        </span>
                      )}
                    </div>
                    {submitError && (
                      <p className="mt-1 text-xs text-red-600">{submitError}</p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="mb-1.5 block text-sm text-slate-700">
                      Comment{" "}
                      <span className="text-xs text-slate-400">(optional)</span>
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
                    className="flex items-center gap-2 px-4 py-2 bg-violet-900 text-white rounded-lg hover:bg-violet-950 transition-colors text-sm"
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
                Feedback QR Code
              </h3>
              <p className="text-slate-500 text-xs mb-3">
                Scan to open the citizen feedback form.
              </p>
              <div className="flex flex-col items-center gap-3">
                <img
                  src={qrUrl}
                  alt="QR Code for the citizen feedback form"
                  className="w-40 h-40 border border-slate-200 rounded-lg bg-white"
                />
                  href={feedbackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-700 hover:underline break-all text-center"
                >
                  {feedbackUrl}
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
