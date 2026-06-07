/**
 * Admin Feedback Page
 * Displays citizen ratings and comments submitted on charters.
 */

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MessageSquare, QrCode, Star } from "lucide-react";
import { Modal } from "../../components/Modal";
import {
  getCombinedFeedback,
  getCharterById,
  getDepartmentById,
  getCharters,
  getDepartments,
  formatDateTime,
  FeedbackEntry,
} from "../../store/data";

const GSHEETS_CONFIG = {
  apiKey: "AIzaSyAOam-5qK2RGaR157ylUYkUnFP69BoFRrM",
  spreadsheetId: "1Op53bBwh9weXkt34YcOaTPUXlE-sSJgJFTJ5Pbky0M8",
  sheetName: "Form Responses 1",
  range: "A:Z",
} as const;

type SheetStatus = "idle" | "loading" | "success" | "error";

const EMOJI_SCORE: Record<string, number> = {
  "😀 Lubos na sumasangayon": 5,
  "😊 Sumasangayon": 4,
  "😐 Walang Opinyon": 3,
  "🙁 Hindi Sumasangayon": 2,
  "😦 Lubos na di Sumasangayon": 1,
  "Strongly Agree": 5,
  Agree: 4,
  Neutral: 3,
  Disagree: 2,
  "Strongly Disagree": 1,
  5: 5,
  4: 4,
  3: 3,
  2: 2,
  1: 1,
};

function emojiToScore(value: string) {
  if (!value || value.trim() === "") return 0;
  const trimmed = value.trim();

  if (EMOJI_SCORE[trimmed] !== undefined) return EMOJI_SCORE[trimmed];

  if (trimmed.includes(",")) {
    const scores = trimmed
      .split(",")
      .map((part) => EMOJI_SCORE[part.trim()] || 0)
      .filter((score) => score > 0);
    return scores.length > 0 ? Math.min(...scores) : 0;
  }

  for (const [key, score] of Object.entries(EMOJI_SCORE)) {
    if (trimmed.toLowerCase().includes(key.toLowerCase())) return score;
  }

  const numeric = Number.parseFloat(trimmed.replace(/[^\d.]/g, ""));
  if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 5) {
    return Math.round(numeric);
  }

  return 0;
}

function parseSheetRows(rows: string[][], charterLookup: (service: string) => number) {
  if (!rows || rows.length < 2) return [] as FeedbackEntry[];

  const headers = rows[0].map((header) => String(header || "").trim());
  const dataRows = rows.slice(1);

  function findColumn(keywords: string[]) {
    for (const keyword of keywords) {
      const index = headers.findIndex((header) =>
        header.toLowerCase().includes(keyword.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return -1;
  }

  const columns = {
    timestamp: findColumn(["Timestamp", "timestamp"]),
    name: findColumn(["Uri ng Kliyente", "name", "respondent", "client"]),
    service: findColumn(["Serbisyon", "service availed", "service", "transaction"]),
    gender: findColumn(["Kasarian", "gender", "sex"]),
    age: findColumn(["Edad", "age"]),
    comment: findColumn(["mungkahi", "suggestion", "comment", "remarks", "feedback"]),
    email: findColumn(["Email", "email"]),
    sqd0: findColumn(["SQD0", "nasisiyahan", "satisfied", "overall"]),
    sqd1: findColumn(["SQD1", "oras", "time", "duration"]),
    sqd2: findColumn(["SQD2", "sinunod", "followed", "accuracy"]),
    sqd3: findColumn(["SQD3", "madali at simple", "simple", "ease"]),
    sqd4: findColumn(["SQD4", "impormasyon", "information"]),
    sqd5: findColumn(["SQD5", "bayarin", "fees", "payment"]),
    sqd6: findColumn(["SQD6", "patas", "fair", "fairness"]),
    sqd7: findColumn(["SQD7", "Magalang", "courtesy", "staff"]),
    sqd8: findColumn(["SQD8", "Nakuha", "obtained", "outcome"]),
  };

  const getValue = (row: string[], index: number) =>
    index !== -1 && index < row.length ? String(row[index] || "").trim() : "";

  return dataRows
    .filter((row) => row && row.length > 1 && row.some((cell) => cell && cell.trim() !== ""))
    .map((row, index) => {
      const scores = [
        columns.sqd0,
        columns.sqd1,
        columns.sqd2,
        columns.sqd3,
        columns.sqd4,
        columns.sqd5,
        columns.sqd6,
        columns.sqd7,
        columns.sqd8,
      ]
        .map((column) => emojiToScore(getValue(row, column)))
        .filter((score) => score > 0);

      const overall = scores.length
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;

      const rawDate = getValue(row, columns.timestamp);
      const parsedDate = rawDate ? new Date(rawDate) : new Date();
      const createdAt = Number.isNaN(parsedDate.getTime())
        ? new Date().toISOString()
        : parsedDate.toISOString();

      const serviceName = getValue(row, columns.service) || "General";
      const charterId = charterLookup(serviceName);

      return {
        uid: `gs-${index}-${createdAt}`,
        id: index + 1,
        charter_id: charterId,
        name: getValue(row, columns.name) || "Anonymous",
        email: getValue(row, columns.email) || null,
        contact: "",
        rating: overall,
        comment: getValue(row, columns.comment) || null,
        created_at: createdAt,
        source: "feedback",
      } satisfies FeedbackEntry;
    })
    .filter((entry) => entry.rating > 0);
}

function getFeedbackDataSourceLabel(gsData: FeedbackEntry[] | null, localCount: number) {
  if (gsData) {
    return `Google Sheets (${gsData.length} rows)`;
  }
  return `Local DB (${localCount} rows)`;
}

async function fetchSheetTabs() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${GSHEETS_CONFIG.spreadsheetId}?key=${GSHEETS_CONFIG.apiKey}&fields=sheets.properties.title`;
  const response = await fetch(url);
  if (!response.ok) return [] as string[];
  const payload = (await response.json()) as { sheets?: Array<{ properties?: { title?: string } }> };
  return (payload.sheets || [])
    .map((sheet) => sheet.properties?.title)
    .filter((title): title is string => Boolean(title));
}

async function fetchSheetValues(sheetName: string) {
  const encoded = encodeURIComponent(`${sheetName}!${GSHEETS_CONFIG.range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${GSHEETS_CONFIG.spreadsheetId}/values/${encoded}?key=${GSHEETS_CONFIG.apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = await response.json();
      message = payload.error?.message || message;
    } catch {
      // fall through with HTTP status message
    }
    throw new Error(message);
  }
  return (await response.json()) as { values?: string[][] };
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angle: number) {
  const angleInRadians = ((angle - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export function Feedback() {
  const [ratings, setRatings] = useState<FeedbackEntry[]>(getCombinedFeedback());
  const [sheetRatings, setSheetRatings] = useState<FeedbackEntry[] | null>(null);
  const [sheetStatus, setSheetStatus] = useState<SheetStatus>("idle");
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [sheetTabs, setSheetTabs] = useState<string[]>([]);
  const [sheetName, setSheetName] = useState<string>(() => String(GSHEETS_CONFIG.sheetName));
  const [sheetRawRows, setSheetRawRows] = useState<string[][] | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [charterFilter, setCharterFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);

  const departments = useMemo(() => getDepartments(), []);
  const charters = useMemo(() => getCharters(), []);

  useEffect(() => {
    setRatings(getCombinedFeedback());
  }, []);

  const charterLookup = useMemo(() => {
    return (service: string) => {
      const normalized = service.trim().toLowerCase();
      const exact = charters.find((charter) => charter.title.toLowerCase() === normalized);
      if (exact) return exact.id;

      const loose = charters.find(
        (charter) =>
          charter.title.toLowerCase().includes(normalized) || normalized.includes(charter.title.toLowerCase())
      );
      return loose?.id ?? charters[0]?.id ?? 0;
    };
  }, [charters]);

  const activeRatings = sheetRatings ?? ratings;
  const dataSourceLabel = getFeedbackDataSourceLabel(sheetRatings, ratings.length);

  const gformUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSeDyQVXmFWKI1zy7PfH_2nfzssIwTE-ISo84iOEQaRM7yM2-g/viewform?usp=header";

  // QR code + link should always open the Google Form
  const feedbackFormUrl = gformUrl;
  const feedbackQrUrl = feedbackFormUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        feedbackFormUrl
      )}&bgcolor=ffffff&color=1e3a8a`
    : "";

  const sortedRatings = useMemo(() => {
    return [...activeRatings].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activeRatings]);

  const summary = useMemo(() => {
    if (activeRatings.length === 0) {
      return { total: 0, average: 0 };
    }
    const total = activeRatings.reduce((sum, rating) => sum + rating.rating, 0);
    const average = Math.round((total / activeRatings.length) * 10) / 10;
    return { total: activeRatings.length, average };
  }, [activeRatings]);

  const ratingBreakdown = useMemo(() => {
    return [5, 4, 3, 2, 1].map((value) => {
      const count = activeRatings.filter((entry) => entry.rating === value).length;
      const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
      return { value, count, pct };
    });
  }, [activeRatings, summary.total]);

  const sourceBreakdown = useMemo(() => {
    const ratingCount = activeRatings.filter((entry) => entry.source === "rating").length;
    const feedbackCount = activeRatings.filter((entry) => entry.source === "feedback").length;
    const total = summary.total || 1;
    return [
      {
        label: "Legacy ratings",
        count: ratingCount,
        pct: Math.round((ratingCount / total) * 100),
        color: "#475569",
      },
      {
        label: "QR / form",
        count: feedbackCount,
        pct: Math.round((feedbackCount / total) * 100),
        color: "#059669",
      },
    ];
  }, [activeRatings, summary.total]);

  const sourceSlices = useMemo(() => {
    let currentAngle = 0;
    return sourceBreakdown.map((item) => {
      const sliceAngle = (item.pct / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const midAngle = startAngle + sliceAngle / 2;
      currentAngle = endAngle;
      return {
        ...item,
        startAngle,
        endAngle,
        midAngle,
      };
    });
  }, [sourceBreakdown]);

  const ratingSummaryLabel = useMemo(() => {
    if (summary.total === 0) return "No ratings yet";
    const topCount = ratingBreakdown[0]?.count ?? 0;
    return `${topCount} rating${topCount === 1 ? "" : "s"} at ${ratingBreakdown[0]?.value ?? 0} stars`;
  }, [ratingBreakdown, summary.total]);

  const sourceSummaryLabel = useMemo(() => {
    if (summary.total === 0) return "No sources yet";
    const dominant = sourceBreakdown.reduce((best, current) =>
      current.count > best.count ? current : best
    , sourceBreakdown[0]);
    return `${dominant.label} is the main source (${dominant.pct}%)`;
  }, [sourceBreakdown, summary.total]);

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
        } ${rating.name ?? ""} ${rating.email ?? ""} ${
          rating.contact ?? ""
        } ${rating.source}`.toLowerCase();
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

  const loadGoogleSheetsData = async () => {
    setSheetStatus("loading");
    setSheetError(null);

    try {
      const tabs = await fetchSheetTabs();
      setSheetTabs(tabs);

      const selectedTab = tabs.includes(sheetName)
        ? sheetName
        : tabs.find((tab) => /response|feedback/i.test(tab)) || tabs[0] || GSHEETS_CONFIG.sheetName;
      setSheetName(selectedTab);

      const response = await fetchSheetValues(selectedTab);
      const rows = response.values || [];
      if (rows.length === 0) {
        throw new Error("The sheet is empty.");
      }

      const parsed = parseSheetRows(rows, charterLookup);
      if (parsed.length === 0) {
        throw new Error("No valid rows found. Check that rating columns use the correct format.");
      }

      // Keep raw rows for per-question breakdown visualization
      setSheetRawRows(rows);

      setSheetRatings(parsed);
      setSheetStatus("success");
    } catch (error) {
      setSheetRatings(null);
      setSheetStatus("error");

      let message = error instanceof Error ? error.message : "Unknown error";
      if (/403|PERMISSION_DENIED/.test(message)) {
        message = "Sheet is private - share it with Anyone with the link as Viewer.";
      } else if (/404|NOT_FOUND/.test(message)) {
        message = "Spreadsheet not found. Verify the Spreadsheet ID.";
      } else if (/API_KEY|API key/.test(message)) {
        message = "Invalid API key.";
      }
      setSheetError(message);
    }
  };

  const useLocalData = () => {
    setSheetRatings(null);
    setSheetRawRows(null);
    setSheetStatus("idle");
    setSheetError(null);
  };

  const handleExportCsv = () => {
    const rows = filteredRatings.map((rating) => {
      const charter = getCharterById(rating.charter_id);
      const department = charter ? getDepartmentById(charter.department_id) : undefined;
      return {
        charter: charter?.title ?? "Unknown charter",
        department: department?.name ?? "—",
        name: rating.name ?? "",
        email: rating.email ?? "",
        contact: rating.contact ?? "",
        source: rating.source === "feedback" ? "QR/Form" : "Rating",
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

    const header = [
      "Charter",
      "Department",
      "Name",
      "Email",
      "Contact",
      "Source",
      "Rating",
      "Comment",
      "Date",
    ].join(",");
    const body = rows
      .map((row) =>
        [
          escapeValue(row.charter),
          escapeValue(row.department),
          escapeValue(row.name),
          escapeValue(row.email),
          escapeValue(row.contact),
          escapeValue(row.source),
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(feedbackFormUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const selectedCharter = selectedFeedback
    ? getCharterById(selectedFeedback.charter_id)
    : undefined;
  const selectedDepartment = selectedCharter
    ? getDepartmentById(selectedCharter.department_id)
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-slate-900">Feedback</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Citizen feedback responses submitted per charter.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <a
            href={feedbackFormUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            View Feedback (GForm)
          </a>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MessageSquare className="h-4 w-4" />
            {summary.total} total responses
          </div>
        </div>
      </div>

      <div className="gs-panel">
        <div className="gs-panel-left">
          <div className="gs-logo">
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <rect width="40" height="40" rx="8" fill="#0F9D58" />
              <path d="M11 12h18v4H11zM11 18h18v4H11zM11 24h12v4H11z" fill="#fff" />
            </svg>
          </div>
          <div className="gs-info">
            <strong>Google Sheets Integration</strong>
            <span id="gs-data-source-label" className="gs-src-label">
              {dataSourceLabel}
            </span>
          </div>
        </div>

        <div className="gs-panel-center">
          <div className="gs-controls">
            <label htmlFor="gs-sheet-tab">Sheet</label>
            {sheetTabs.length > 0 && (
              <select
                id="gs-sheet-tab"
                value={sheetName}
                onChange={(event) => setSheetName(event.target.value)}
              >
                {sheetTabs.map((tab) => (
                  <option key={tab} value={tab}>
                    {tab}
                  </option>
                ))}
              </select>
            )}
            <span
              className={`gs-status-badge gs-${sheetStatus}`}
              id="gs-status-badge"
            >
              <span className="gs-dot" />
              {sheetStatus === "success"
                ? `Connected${sheetRatings ? ` · ${sheetRatings.length} rows` : ""}`
                : sheetStatus === "error"
                  ? "Connection Error"
                  : sheetStatus === "loading"
                    ? "Syncing…"
                    : "Not synced"}
            </span>
          </div>
          <div className="gs-msg-row">
            <p id="gs-status-msg">{sheetError || "Sync responses from Google Sheets or use the local database."}</p>
            <div className="gs-col-map">
              <span className="col-chip col-chip-ok">Admin feedback sync</span>
            </div>
          </div>
        </div>

        <div className="gs-panel-right">
          <button
            type="button"
            id="gs-refresh-btn"
            className="btn-gs"
            onClick={loadGoogleSheetsData}
            disabled={sheetStatus === "loading"}
          >
            {sheetStatus === "loading" ? "Syncing…" : "⟳ Sync Now"}
          </button>
          <button
            type="button"
            className="btn-gs"
            onClick={useLocalData}
          >
            Use Local Data
          </button>
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
          <p className="mt-1 text-sm text-slate-500">All submitted responses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-slate-900">Rating Breakdown</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Distribution of all ratings from highest to lowest.
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              {ratingSummaryLabel}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {ratingBreakdown.map((item) => {
              const label = item.value === 1 ? "1 star" : `${item.value} stars`;
              const width = `${Math.max(item.pct, item.count > 0 ? 6 : 0)}%`;
              return (
                <div key={item.value} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="text-slate-500">
                      {item.count} response{item.count === 1 ? "" : "s"} · {item.pct}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                      style={{ width }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-slate-900">Source Breakdown</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Where the responses came from.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {sourceSummaryLabel}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex h-4 overflow-hidden rounded-full bg-slate-200">
                {sourceBreakdown.map((item) => (
                  <div
                    key={item.label}
                    title={`${item.label}: ${item.count} (${item.pct}%)`}
                    className="h-4"
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  />
                ))}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {sourceBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-700">{item.label}</div>
                      <div className="text-xs text-slate-500">
                        {item.count} response{item.count === 1 ? "" : "s"} · {item.pct}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {sourceBreakdown.map((item) => (
                <div key={`${item.label}-stat`} className="rounded-xl border border-slate-200 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">{item.label}</div>
                  <div className="mt-1 text-2xl text-slate-900">{item.count}</div>
                  <div className="text-sm text-slate-500">{item.pct}% of responses</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

        {/* Per-question breakdown from Google Sheets (matches form response layout) */}
        {sheetRawRows && (
          <div className="grid grid-cols-1 gap-4">
            {(() => {
              const headers = sheetRawRows[0] || [];
              const rows = sheetRawRows.slice(1);
              const skipKeys = ["timestamp", "email", "uri ng kliyente", "name", "service", "contact", "phone", "mungkahi", "comment", "remarks"];
              const candidates = headers
                .map((h, i) => ({ h: String(h || "").trim(), i }))
                .filter(({ h }) => {
                  if (!h) return false;
                  const lh = h.toLowerCase();
                  if (skipKeys.some((k) => lh.includes(k))) return false;
                  return true;
                });

              return candidates.map(({ h, i }) => {
                const counts = new Map<string, number>();
                for (const r of rows) {
                  const v = String(r[i] || "").trim();
                  if (!v) continue;
                  counts.set(v, (counts.get(v) || 0) + 1);
                }
                if (counts.size === 0) return null;
                const items = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
                const totalRowsCount = rows.length || 1;
                const max = items[0][1] || 1;
                const lh = h.toLowerCase();

                // Date (Petsa) - show month and recent day chips
                if (/petsa|date|petsang|date submitted/i.test(lh)) {
                  // collect timestamps from rows
                  const dates: Date[] = [];
                  for (const r of rows) {
                    const raw = String(r[i] || "").trim();
                    if (!raw) continue;
                    const d = new Date(raw);
                    if (!Number.isNaN(d.getTime())) dates.push(d);
                  }
                  if (dates.length === 0) return null;
                  dates.sort((a, b) => b.getTime() - a.getTime());
                  const latestMonth = dates[0];
                  const monthLabel = latestMonth.toLocaleString(undefined, { month: 'short', year: 'numeric' });
                  // group counts by day of month within that month
                  const dayCounts = new Map<number, number>();
                  for (const d of dates) {
                    if (d.getMonth() === latestMonth.getMonth() && d.getFullYear() === latestMonth.getFullYear()) {
                      const day = d.getDate();
                      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
                    }
                  }
                  const dayItems = Array.from(dayCounts.entries()).sort((a, b) => b[0] - a[0]);
                  // show the top 4 most recent days (descending day)
                  const recent = dayItems.slice(0, 4).sort((a, b) => b[0] - a[0]);

                  const colors = ['#7C3AED', '#C084FC', '#E9D5FF', '#E5E7EB'];

                  return (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-slate-900">{h}</h3>
                          <p className="mt-0.5 text-xs text-slate-500">{dates.length} responses</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-6">
                        <div className="text-sm font-medium">{monthLabel}</div>
                        <div className="border-l h-6" />
                        <div className="flex items-center gap-2">
                          {recent.map(([day, count], idx) => (
                            <div key={day} className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: colors[idx % colors.length], color: idx===3? '#374151':'#fff' }}>
                              <div className="text-sm font-semibold">{count}</div>
                              <div className="text-xs opacity-80">{String(day)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Gender pie chart (Kasarian)
                if (/kasarian|gender|sex/.test(lh)) {
                  let start = 0;
                  return (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-slate-900">{h}</h3>
                          <p className="mt-0.5 text-xs text-slate-500">{items.length} category{items.length===1?"":"ies"}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-6">
                        <svg width={160} height={120} viewBox="0 0 160 120">
                          <g transform="translate(80,60)">
                            {items.map(([label, count], idx) => {
                              const angle = (count / totalRowsCount) * 360;
                              const slice = describeArc(0, 0, 40, start, start + angle);
                              const color = ["#6366F1", "#A78BFA", "#7C3AED", "#E879F9", "#C084FC"][idx % 5];
                              start += angle;
                              return <path key={label} d={slice} fill={color} stroke="#fff" strokeWidth={0.5} />;
                            })}
                          </g>
                        </svg>

                        <div className="flex-1">
                          {items.map(([label, count]) => (
                            <div key={label} className="flex items-center gap-3 mb-2">
                              <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: "#7C3AED" }} />
                              <div className="min-w-0 flex-1 text-sm text-slate-700 truncate">{label}</div>
                              <div className="text-xs text-slate-500">{count} · {Math.round((count/totalRowsCount)*100)}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Client type pie chart (Uri ng Kliyente)
                if (/uri ng kliyente|uri ng|kliyente|client type|client/i.test(lh)) {
                  let start2 = 0;
                  return (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-slate-900">{h}</h3>
                          <p className="mt-0.5 text-xs text-slate-500">{items.length} category{items.length===1?"":"ies"}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-6">
                        <svg width={160} height={120} viewBox="0 0 160 120">
                          <g transform="translate(80,60)">
                            {items.map(([label, count], idx) => {
                              const angle = (count / totalRowsCount) * 360;
                              const slice = describeArc(0, 0, 40, start2, start2 + angle);
                              const colors = ["#F97316", "#0EA5A4", "#6366F1", "#F472B6", "#60A5FA"];
                              const color = colors[idx % colors.length];
                              start2 += angle;
                              return <path key={label} d={slice} fill={color} stroke="#fff" strokeWidth={0.5} />;
                            })}
                          </g>
                        </svg>

                        <div className="flex-1">
                          {items.map(([label, count], idx) => (
                            <div key={label} className="flex items-center gap-3 mb-2">
                              <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: ["#F97316", "#0EA5A4", "#6366F1", "#F472B6", "#60A5FA"][idx % 5] }} />
                              <div className="min-w-0 flex-1 text-sm text-slate-700 truncate">{label}</div>
                              <div className="text-xs text-slate-500">{count} · {Math.round((count/totalRowsCount)*100)}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Age vertical bar chart (Edad)
                if (/edad|age/.test(lh)) {
                  // bucket ages
                  const buckets: [string, (n: number) => boolean][] = [
                    ["<18", (n) => n < 18],
                    ["18-25", (n) => n >= 18 && n <= 25],
                    ["26-35", (n) => n >= 26 && n <= 35],
                    ["36-45", (n) => n >= 36 && n <= 45],
                    ["46-60", (n) => n >= 46 && n <= 60],
                    ["60+", (n) => n > 60],
                  ];
                  const bucketCounts = buckets.map(([label, test]) => {
                    let c = 0;
                    for (const r of rows) {
                      const raw = String(r[i] || "").trim();
                      const num = Number.parseInt(raw.replace(/[^0-9]/g, "")) || NaN;
                      if (!Number.isNaN(num) && test(num)) c++;
                    }
                    return c;
                  });
                  const maxBucket = Math.max(...bucketCounts, 1);

                  return (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-slate-900">{h}</h3>
                        </div>
                      </div>

                      <div className="mt-4 flex items-end gap-4 h-40">
                        {buckets.map(([label], idx) => (
                          <div key={label} className="flex flex-col items-center gap-2">
                            <div className="w-10 bg-purple-100" style={{ height: `${Math.round((bucketCounts[idx]/maxBucket)*100)}%`, minHeight: 6 }} />
                            <div className="text-xs text-slate-500">{label}</div>
                            <div className="text-xs text-slate-700">{bucketCounts[idx]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // SQD / survey questions: horizontal percentage bars based on total responses
                if (/sqd|sqdo|sqd0|sqd1|sqd2|sqd3|sqd4|sqd5|sqd6|sqd7|sqd8/.test(lh)) {
                  return (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-slate-900">{h}</h3>
                        </div>
                      </div>

                      <div className="mt-3 space-y-3">
                        {items.map(([label, count]) => {
                          const pct = Math.round((count / totalRowsCount) * 100);
                          return (
                            <div key={label} className="flex items-center gap-3">
                              <div className="w-44 text-sm text-slate-700 truncate">{label}</div>
                              <div className="flex-1">
                                <div className="h-4 rounded bg-purple-100">
                                  <div style={{ width: `${pct}%` }} className="h-4 rounded bg-purple-600" />
                                </div>
                              </div>
                              <div className="w-12 text-xs text-slate-500 text-right">{pct}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Default horizontal bars (relative to max)
                return (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-slate-900">{h}</h3>
                      </div>
                    </div>

                    <div className="mt-3 space-y-3">
                      {items.map(([label, count]) => {
                        const pct = Math.round((count / max) * 100);
                        return (
                          <div key={label} className="flex items-center gap-3">
                            <div className="w-44 text-sm text-slate-700 truncate">{label}</div>
                            <div className="flex-1">
                              <div className="h-4 rounded bg-purple-100">
                                <div style={{ width: `${pct}%` }} className="h-4 rounded bg-purple-600" />
                              </div>
                            </div>
                            <div className="w-12 text-xs text-slate-500 text-right">{count}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-slate-900">Latest Feedback</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Showing {filteredRatings.length} of {sortedRatings.length} response
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
                placeholder="Search charter, department, name, or comment"
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
            <button
              type="button"
              onClick={() => setIsQrOpen(true)}
              disabled={!feedbackFormUrl}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              <QrCode className="h-4 w-4" />
              Feedback Form QR
            </button>
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
                <th className="hidden px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500 lg:table-cell">
                  Name
                </th>
                <th className="hidden px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500 lg:table-cell">
                  Email
                </th>
                <th className="hidden px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500 lg:table-cell">
                  Contact
                </th>
                <th className="hidden px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500 lg:table-cell">
                  Source
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
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-slate-500">
                  Action
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
                  <tr
                    key={rating.uid}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-blue-900/50"
                  >
                    <td className="px-6 py-3.5 text-sm text-slate-900">
                      {charter?.title || "Unknown charter"}
                    </td>
                    <td className="hidden px-6 py-3.5 text-sm text-slate-500 md:table-cell">
                      {department?.name || "—"}
                    </td>
                    <td className="hidden px-6 py-3.5 text-sm text-slate-500 lg:table-cell">
                      {rating.name || "—"}
                    </td>
                    <td className="hidden px-6 py-3.5 text-sm text-slate-500 lg:table-cell">
                      {rating.email || "—"}
                    </td>
                    <td className="hidden px-6 py-3.5 text-sm text-slate-500 lg:table-cell">
                      {rating.contact || "—"}
                    </td>
                    <td className="hidden px-6 py-3.5 text-sm text-slate-500 lg:table-cell">
                      {rating.source === "feedback" ? "QR/Form" : "Rating"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-200">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-600 dark:fill-amber-300 dark:text-amber-300" />
                        {rating.rating}
                      </span>
                    </td>
                    <td className="hidden px-6 py-3.5 text-sm text-slate-500 sm:table-cell">
                      {rating.comment?.trim() || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-500">
                      {formatDateTime(rating.created_at)}
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelectedFeedback(rating)}
                        className="text-xs text-blue-700 transition-colors hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRatings.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
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

      <Modal
        isOpen={Boolean(selectedFeedback)}
        onClose={() => setSelectedFeedback(null)}
        title="Feedback Details"
        size="sm"
      >
        {selectedFeedback ? (
          <div className="space-y-3 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Charter</p>
              <p className="text-slate-900">
                {selectedCharter?.title || "Unknown charter"}
              </p>
              <p className="text-xs text-slate-400">
                {selectedDepartment?.name || "—"}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Name</p>
                <p className="text-slate-900">{selectedFeedback.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Contact</p>
                <p className="text-slate-900">{selectedFeedback.contact || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                <p className="text-slate-900">{selectedFeedback.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Source</p>
                <p className="text-slate-900">
                  {selectedFeedback.source === "feedback" ? "QR/Form" : "Rating"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Rating</p>
                <p className="text-slate-900">{selectedFeedback.rating}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Date</p>
                <p className="text-slate-900">
                  {formatDateTime(selectedFeedback.created_at)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Comment</p>
              <p className="text-slate-900">
                {selectedFeedback.comment?.trim() || "—"}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        title="Feedback Form QR"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          {feedbackQrUrl ? (
            <>
              <img
                src={feedbackQrUrl}
                alt="QR code for feedback form"
                className="h-44 w-44 rounded-lg border border-slate-200 bg-white"
              />
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={feedbackFormUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
                >
                  Open feedback form
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
                >
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Scan the QR code or open the link to submit feedback.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No charter available for QR.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
