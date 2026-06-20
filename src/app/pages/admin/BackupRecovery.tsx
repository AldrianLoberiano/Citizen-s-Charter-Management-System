import { useState, useRef, useCallback } from "react";
import { Database, Download, Upload, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { api } from "../../lib/api";

export function BackupRecovery() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setMessage(null);
      setIsExporting(true);
      const blob = await api.downloadBackup();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup_ccms_db_${new Date().toISOString().slice(0, 10)}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage({ type: "success", text: "Backup exported successfully. File downloaded to your device." });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to export backup.";
      setMessage({ type: "error", text });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (file?: File | null) => {
    if (file && file.name.endsWith(".sql")) {
      setSelectedFile(file);
      setMessage(null);
      setConfirmRestore(false);
    } else if (file) {
      setMessage({ type: "error", text: "Please select a valid .sql file." });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  }, []);

  const handleImport = async () => {
    if (!selectedFile) return;
    try {
      setMessage(null);
      setIsImporting(true);
      await api.restoreBackup(selectedFile);
      setMessage({ type: "success", text: "Database restored successfully from backup." });
      setSelectedFile(null);
      setConfirmRestore(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to restore database.";
      setMessage({ type: "error", text: msg });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-xl bg-white px-6 py-4 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-slate-900 dark:text-white">Backup & Recovery</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Export or import SQL backups for the CCMS database.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Database className="h-4 w-4" />
            Admin tools
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`flex items-start gap-3 rounded-xl border px-5 py-4 ${
          message.type === "success"
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50"
            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50"
        }`}>
          {message.type === "success"
            ? <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            : <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          }
          <p className={`text-sm ${
            message.type === "success"
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-red-700 dark:text-red-300"
          }`}>{message.text}</p>
        </div>
      )}

      {/* Export Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
            <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Export Backup</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Download a complete SQL backup of the current database. This file can be used to restore your data later.
            </p>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className={`h-4 w-4 ${isExporting ? "animate-bounce" : ""}`} />
              {isExporting ? "Exporting..." : "Export SQL Backup"}
            </button>
          </div>
        </div>
      </div>

      {/* Import Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
            <Upload className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Restore Backup</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Upload a .sql backup file to restore the database. This will overwrite existing data.
            </p>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition-colors ${
                dragOver
                  ? "border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/30"
                  : selectedFile
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".sql"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />
              {selectedFile ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Click to select a different file</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Drag & drop a <span className="font-medium">.sql</span> file here, or <span className="font-medium text-amber-600 dark:text-amber-400">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">SQL backup files only</p>
                </>
              )}
            </div>

            {/* Restore Warning + Confirm */}
            {selectedFile && (
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-950/30">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Restoring a backup will overwrite current database data. This action cannot be undone.
                  </p>
                </div>

                {!confirmRestore ? (
                  <button
                    type="button"
                    onClick={() => setConfirmRestore(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
                  >
                    <Shield className="h-4 w-4" />
                    Restore Backup
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={isImporting}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 active:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isImporting ? "Restoring..." : "Yes, Restore Now"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRestore(false)}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Commands */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setShowCommands(!showCommands)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Manual Commands</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Run these in a local terminal on the machine hosting MySQL.
            </p>
          </div>
          {showCommands
            ? <ChevronUp className="h-5 w-5 text-slate-400" />
            : <ChevronDown className="h-5 w-5 text-slate-400" />
          }
        </button>
        {showCommands && (
          <div className="grid gap-4 border-t border-slate-100 px-6 py-5 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Export Backup</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                mysqldump -u root -p ccms_db &gt; backup.sql
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Restore Backup</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                mysql -u root -p ccms_db &lt; backup.sql
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Export with Date</p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                mysqldump -u root -p ccms_db &gt; backup_YYYYMMDD.sql
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}