import { useState, useEffect } from "react";
import { Search, FileText, User, Trash2 } from "lucide-react";
import { api, FILE_BASE } from "../../lib/api";
import { Modal } from "../../components/Modal";

interface EditedCharter {
  id: number;
  charter_id: number;
  file_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  submitted_name: string | null;
  notes: string;
  created_at: string;
  charter_title: string;
  department_name: string;
}

export function EditedCharters() {
  const [edits, setEdits] = useState<EditedCharter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<EditedCharter | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.getAllEditedCharters()
      .then((data: any) => setEdits(Array.isArray(data) ? data : []))
      .catch(() => setEdits([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = edits.filter((e) =>
    e.charter_title.toLowerCase().includes(search.toLowerCase()) ||
    (e.department_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API_BASE}/edited-charters/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setEdits((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(`Failed to delete: ${err?.message || err}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white dark:bg-slate-900 px-6 py-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-slate-900 dark:text-white">Edited Charters</h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              {edits.length} edit{edits.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by charter or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8 text-sm text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600 mr-2" />
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-slate-500">
            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm">No edited charters found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide dark:text-slate-400">Charter</th>
                  <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide hidden md:table-cell">Department</th>
                  <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide hidden lg:table-cell">Editor</th>
                  <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide hidden lg:table-cell">File</th>
                  <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide hidden lg:table-cell">Size</th>
                  <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((edit) => (
                  <tr key={edit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{edit.charter_title}</p>
                      {edit.notes && <p className="text-xs text-slate-400 mt-0.5">{edit.notes}</p>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell">
                      {edit.department_name || "-"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                      {edit.submitted_name ? (
                        <span className="inline-flex items-center gap-1.5 text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full text-xs dark:text-violet-300 dark:bg-violet-950/50 dark:border-violet-800">
                          <User className="w-3 h-3" />
                          {edit.submitted_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 hidden lg:table-cell truncate max-w-[200px]">
                      {edit.original_name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                      {edit.size_bytes ? `${(edit.size_bytes / 1024).toFixed(1)} KB` : "-"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(edit.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setDeleteTarget(edit)}
                        className="text-slate-600 hover:text-red-600 transition-colors dark:text-slate-400 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Edited Charter"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete this edited charter?
          </p>
          {deleteTarget && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-sm">
              <p className="font-medium text-slate-900 dark:text-white">{deleteTarget.charter_title}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{deleteTarget.original_name}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 transition-colors hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
