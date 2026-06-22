/**
 * Charter Detail Page (Client-facing)
 * Displays full charter information including content, file download, QR code,
 * and citizen feedback/rating system
 */

import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router";
import {
  ArrowLeft,
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
  getCombinedFeedbackByCharter,
  getAverageRating,
  addFeedback,
  formatDate,
  formatDateTime,
  FeedbackEntry,
} from "../../store/data";

export function CharterDetail() {
  const { id } = useParams<{ id: string }>();
  const charterId = parseInt(id || "0");

  const charter = getCharterById(charterId);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>(
    getCombinedFeedbackByCharter(charterId)
  );
  const [avgRating, setAvgRating] = useState(getAverageRating(charterId));

  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!charter) {
    return <Navigate to="/" replace />;
  }

  const department = getDepartmentById(charter.department_id);
  const gformUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSeDyQVXmFWKI1zy7PfH_2nfzssIwTE-ISo84iOEQaRM7yM2-g/viewform?usp=header";

  const feedbackUrl = gformUrl;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    feedbackUrl
  )}&bgcolor=ffffff&color=1e3a8a`;
  const hasAttachment = Boolean(charter.file_path?.trim());
  const attachmentUrl = hasAttachment
    ? charter.file_path!.startsWith("/")
      ? charter.file_path!
      : charter.file_path!.startsWith("uploads/")
        ? `/${charter.file_path!}`
        : `/uploads/charters/${charter.file_path!}`
    : "";

  const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(
    /\/api$/,
    ""
  );

  const resolveFileUrl = (filePath: string) => {
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
    if (filePath.startsWith("/")) return `${FILE_BASE}${filePath}`;
    return `${FILE_BASE}/${filePath}`;
  };

  type ViewerType = "pdf" | "docx" | "unknown";

  const getViewerType = (filePath: string): ViewerType => {
    const lower = filePath.toLowerCase();
    if (lower.endsWith(".pdf")) return "pdf";
    if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "docx";
    return "unknown";
  };

  const viewerType = attachmentUrl ? getViewerType(attachmentUrl) : "unknown";
  const resolvedAttachmentUrl = attachmentUrl ? resolveFileUrl(attachmentUrl) : "";
  const [fileStatus, setFileStatus] = useState<"unknown" | "available" | "missing">(
    hasAttachment ? "unknown" : "missing"
  );

  useEffect(() => {
    if (!hasAttachment) {
      setFileStatus("missing");
      return;
    }

    let active = true;
    setFileStatus("unknown");

    fetch(resolvedAttachmentUrl, { method: "HEAD" })
      .then((response) => {
        if (!active) return;
        setFileStatus(response.ok ? "available" : "missing");
      })
      .catch(() => {
        if (!active) return;
        setFileStatus("missing");
      });

    return () => {
      active = false;
    };
  }, [hasAttachment, resolvedAttachmentUrl]);

  const formattedContent = charter.content.split("\n").map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={idx} />;

    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith("-")) {
      return (
        <p key={idx} className="text-slate-800 dark:text-slate-200 mt-4 mb-1">
          {trimmed}
        </p>
      );
    }

    if (trimmed.startsWith("-")) {
      return (
        <li key={idx} className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed ml-4">
          {trimmed.slice(1).trim()}
        </li>
      );
    }

    if (/^\d+\./.test(trimmed)) {
      return (
        <li
          key={idx}
          className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed ml-4 list-decimal"
        >
          {trimmed.replace(/^\d+\.\s*/, "")}
        </li>
      );
    }

    return (
      <p key={idx} className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        {trimmed}
      </p>
    );
  });

  const handleDownload = () => {
    if (fileStatus !== "available") return;
    window.open(resolvedAttachmentUrl, "_blank", "noopener,noreferrer");
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!name.trim()) {
      setSubmitError("Please enter your name before submitting.");
      return;
    }

    if (selectedStar === 0) {
      setSubmitError("Please select a star rating before submitting.");
      return;
    }

    try {
      const newRating = await addFeedback({
        charter_id: charterId,
        name: name.trim(),
        email: email.trim(),
        contact: contact.trim(),
        rating: selectedStar,
        comment: comment.trim(),
      });

      const updatedRatings = [...feedbackEntries, newRating];
      setFeedbackEntries(updatedRatings);
      setAvgRating(
        Math.round(
          (updatedRatings.reduce((a, r) => a + r.rating, 0) /
            updatedRatings.length) *
            10
        ) / 10
      );
      setName("");
      setEmail("");
      setContact("");
      setComment("");
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit rating.");
    }
  };

  const starLabel = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div>
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto w-full px-6 py-10 sm:px-10 lg:px-16">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link to="/" className="transition-colors hover:text-slate-900 dark:hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            {department && (
              <>
                <Link
                  to={`/department/${department.id}`}
                  className="transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  {department.name}
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
            <span className="max-w-xs truncate text-slate-900 dark:text-white">{charter.title}</span>
          </nav>

          <div className="flex items-start gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-slate-950 dark:text-white normal-case break-words">
                {charter.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                {department && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <Building2 className="h-4 w-4" />
                    {department.name}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Clock className="h-4 w-4" />
                  Published {formatDate(charter.created_at)}
                </div>
                {feedbackEntries.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    {avgRating} ({feedbackEntries.length} review
                    {feedbackEntries.length !== 1 ? "s" : ""})
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full px-6 py-10 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                <h2 className="text-slate-900 dark:text-white">Service Information</h2>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4 text-xs text-slate-400">
                  <span>Service details</span>
                  <span>Published {formatDate(charter.created_at)}</span>
                </div>

                <div className="space-y-3">
                  {formattedContent}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4 text-xs text-slate-400">
                  <span>Calauan Citizen's Charter Management System</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
                <div>
                  <h3 className="text-slate-900 dark:text-white">
                    {viewerType === "pdf" ? "PDF Viewer" : "Attachment Viewer"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    View the attached charter document
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={fileStatus !== "available"}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Full Page
                </button>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3">
                {fileStatus === "missing" && (
                  <div className="p-4 text-sm text-slate-500 dark:text-slate-400">404 not found</div>
                )}
                {fileStatus === "unknown" && (
                  <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Checking attachment...</div>
                )}
                {fileStatus === "available" && viewerType === "pdf" && (
                  <iframe
                    src={resolvedAttachmentUrl}
                    title={`${charter.title} PDF preview`}
                    className="h-[720px] w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white"
                  />
                )}
                {fileStatus === "available" && viewerType === "docx" && (
                  <iframe
                    title={`${charter.title} Word document preview`}
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolvedAttachmentUrl)}`}
                    className="h-[720px] w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white"
                  />
                )}
                {fileStatus === "available" && viewerType === "unknown" && (
                  <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
                    No preview available for this file type. Use View Full Page to open it.
                  </div>
                )}
              </div>
            </div>

            <div id="feedback-form" className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                <h2 className="text-slate-900 dark:text-white">Citizen Feedback</h2>
              </div>

              {submitted ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 p-4 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p>Thank you for your feedback!</p>
                    <p className="mt-0.5 text-sm text-emerald-600 dark:text-emerald-500">
                      Your rating has been submitted and helps improve our
                      services.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitRating} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm text-slate-700 dark:text-slate-300">
                        Full name
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        maxLength={150}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm text-slate-700 dark:text-slate-300">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        maxLength={190}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm text-slate-700 dark:text-slate-300">
                        Contact number (optional)
                      </label>
                      <input
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="0917 123 4567"
                        maxLength={50}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-700 dark:text-slate-300">
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
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                      {(hoverStar || selectedStar) > 0 && (
                        <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">
                          {starLabel[hoverStar || selectedStar]}
                        </span>
                      )}
                    </div>
                    {submitError && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{submitError}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-slate-700 dark:text-slate-300">
                      Comment{" "}
                      <span className="text-xs text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this service..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="text-slate-400 dark:text-slate-500 text-xs text-right mt-1">
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

              {feedbackEntries.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-700 dark:text-slate-300">
                      Reviews ({feedbackEntries.length})
                    </h3>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span className="text-slate-700 dark:text-slate-300">{avgRating} / 5</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = feedbackEntries.filter(
                        (r) => r.rating === star
                      ).length;
                      const pct =
                        feedbackEntries.length > 0
                          ? Math.round((count / feedbackEntries.length) * 100)
                          : 0;
                      return (
                        <div
                          key={star}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="text-slate-500 dark:text-slate-400 w-3">{star}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-slate-400 dark:text-slate-500 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3 mt-4">
                    {feedbackEntries
                      .filter((r) => r.comment)
                      .slice(-5)
                      .reverse()
                      .map((r) => (
                        <div
                          key={r.uid}
                          className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= r.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300 dark:text-slate-600"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-slate-600 dark:text-slate-300 text-xs">
                              {r.name || "Anonymous"}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 text-xs">
                              {formatDateTime(r.created_at)}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-sm">{r.comment}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <Link
              to="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 transition-colors hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                Feedback QR Code
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                Scan to open the citizen feedback form.
              </p>
              <div className="flex flex-col items-center gap-3">
                <img
                  src={qrUrl}
                  alt="QR Code for the citizen feedback form"
                  className="w-40 h-40 border border-slate-200 dark:border-slate-600 rounded-lg bg-white"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}