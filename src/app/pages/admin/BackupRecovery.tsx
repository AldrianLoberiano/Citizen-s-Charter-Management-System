/**
 * Backup & Recovery Page
 * Provides UI for exporting and importing SQL backups.
 */

import { useState } from "react";
import { Database, Download, Upload } from "lucide-react";
import { api } from "../../lib/api";

export function BackupRecovery() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to export backup.";
      setMessage(text);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file?: File | null) => {
    if (!file) return;
    try {
      setMessage(null);
      setIsImporting(true);
      await api.restoreBackup(file);
      setMessage("Backup imported successfully.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to import backup.";
      setMessage(text);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            <div>
              <p className="text-slate-900 dark:text-white">Export / Backup</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Download a SQL backup of the current database.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="mt-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 transition-colors hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? "Exporting..." : "Export SQL"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            <div>
              <p className="text-slate-900 dark:text-white">Import / Restore</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Upload a .sql backup to restore the database.
              </p>
            </div>
          </div>
          <input
            type="file"
            accept=".sql"
            onChange={(event) => handleImport(event.target.files?.[0])}
            className="mt-4 block w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white dark:file:bg-slate-800 file:px-4 file:py-2 file:text-xs file:text-slate-700 dark:file:text-slate-300 file:shadow-sm file:hover:bg-slate-100 dark:file:hover:bg-slate-700 file:active:bg-slate-200"
          />
          {isImporting && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Importing backup...</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-slate-900 dark:text-white">Manual Commands</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Run these in a local terminal on the machine hosting MySQL.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Export / Backup (mysqldump)</p>
            <pre className="mt-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-700 dark:text-slate-300 overflow-x-auto">
mysqldump -u root -p ccms_db &gt; backup_ccms_db.sql
            </pre>
          </div>
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Import / Restore</p>
            <pre className="mt-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-700 dark:text-slate-300 overflow-x-auto">
mysql -u root -p ccms_db &lt; backup_ccms_db.sql
            </pre>
          </div>
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Export to a custom file name</p>
            <pre className="mt-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-700 dark:text-slate-300 overflow-x-auto">
mysqldump -u root -p ccms_db &gt; backup_ccms_db_YYYYMMDD.sql
            </pre>
          </div>
        </div>
      </div>

      {message && (
        <p className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
          {message}
        </p>
      )}
    </div>
  );
}