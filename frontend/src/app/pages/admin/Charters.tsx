/**
 * Admin Charters Page
 * Full CRUD operations for Citizen's Charters
 * Includes file upload simulation, department selection, and pagination
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  AlertCircle,
  Paperclip,
  X,
  Filter,
  Download,
  User,
  CircleCheck,
} from "lucide-react";
import {
  getCharters,
  getDepartments,
  getDepartmentById,
  createCharter,
  updateCharter,
  deleteCharter,
  updateCharterFilePath,
  Charter,
  Department,
  formatDate,
} from "../../store/data";
import { api } from "../../lib/api";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import { Notification } from "../../components/Notification";
import { PdfEditor } from "../../components/PdfEditor";
import { DocxViewer } from "../../components/DocxViewer";

const ITEMS_PER_PAGE = 8;
const FILE_BASE = import.meta.env.VITE_ENV === "development" ? import.meta.env.VITE_DEV_BASE_URL : import.meta.env.VITE_PROD_BASE_URL;
type ViewerType = "pdf" | "docx" | "unknown";

const getViewerType = (filePath: string): ViewerType => {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return "unknown";
};

const resolveFileUrl = (filePath: string) => {
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  if (filePath.startsWith("/")) return `${FILE_BASE}${filePath}`;
  return `${FILE_BASE}/${filePath}`;
};

interface FormData {
  department_id: string;
  title: string;
  content: string;
  file_path: string;
}

const emptyForm: FormData = {
  department_id: "",
  title: "",
  content: "",
  file_path: "",
};

export function Charters() {
  const [charters, setCharters] = useState<Charter[]>(getCharters());
  const [departments] = useState<Department[]>(getDepartments());

  useEffect(() => {
    api.getCharters().then(setCharters).catch(() => {});
  }, []);

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingCharter, setEditingCharter] = useState<Charter | null>(null);
  const [deletingCharter, setDeletingCharter] = useState<Charter | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFilePath, setViewerFilePath] = useState("");
  const [viewerType, setViewerType] = useState<ViewerType>("unknown");
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewerCharterId, setViewerCharterId] = useState<number | null>(null);

  // Editor name collection
  const [editorNameModalOpen, setEditorNameModalOpen] = useState(false);
  const [editorName, setEditorName] = useState("");
  const [pendingViewerFile, setPendingViewerFile] = useState<{ filePath: string; charterId?: number } | null>(null);
  const editorNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorNameModalOpen) {
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          editorNameInputRef.current?.focus();
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [editorNameModalOpen]);

  // Form
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [viewerSuccess, setViewerSuccess] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    const fresh = await api.getCharters();
    setCharters(fresh);
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Filter charters
  const filtered = charters.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase());
    const matchDept =
      filterDept === "" || c.department_id === parseInt(filterDept);
    return matchSearch && matchDept;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Open add form
  const openAdd = () => {
    setEditingCharter(null);
    setFormData(emptyForm);
    setFormErrors({});
    setFormSuccess(null);
    setFormModalOpen(true);
  };

  // Open edit form
  const openEdit = (charter: Charter) => {
    setEditingCharter(charter);
    setFormData({
      department_id: String(charter.department_id),
      title: charter.title,
      content: charter.content,
      file_path: charter.file_path || "",
    });
    setFormErrors({});
    setFormSuccess(null);
    setFormModalOpen(true);
  };

  // Open delete modal
  const openDelete = (charter: Charter) => {
    setDeletingCharter(charter);
    setDeleteModalOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerFilePath("");
    setViewerType("unknown");
    setViewerError(null);
    setViewerCharterId(null);
    setViewerSuccess(false);
  };

  const handleOpenExternal = useCallback(() => {
    if (viewerFilePath) {
      const url = resolveFileUrl(viewerFilePath);
      window.open(url, "_blank");
    }
  }, [viewerFilePath]);

  const openViewer = async (filePath: string, charterId?: number) => {
    setEditorName("");
    setPendingViewerFile({ filePath, charterId });
    setEditorNameModalOpen(true);
  };

  const confirmEditorName = () => {
    if (!editorName.trim()) return;
    setEditorNameModalOpen(false);
    if (pendingViewerFile) {
      const { filePath, charterId } = pendingViewerFile;
      const type = getViewerType(filePath);
      setViewerOpen(true);
      setViewerFilePath(filePath);
      setViewerType(type);
      setViewerCharterId(charterId ?? null);
      setViewerError(null);
      if (type === "unknown") {
        setViewerError("Preview is not available for this file type.");
      }
    }
  };

  const cancelEditorName = useCallback(() => {
    setEditorNameModalOpen(false);
    setPendingViewerFile(null);
    setEditorName("");
  }, []);

  const handleSaveAttachment = useCallback(async (blob: Blob) => {
    if (!viewerCharterId) return;
    const originalName = viewerFilePath.split("/").pop() || "document.docx";
    const file = new File([blob], originalName, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const result = await api.saveCharterEdit(viewerCharterId, file, editorName.trim());
    setViewerFilePath(result.file_path);
    updateCharterFilePath(viewerCharterId, result.file_path);
    const freshCharters = await api.getCharters();
    setCharters(freshCharters);
    setViewerSuccess(true);
  }, [viewerCharterId, editorName, viewerFilePath]);

  // Validate form
  const validate = (): boolean => {
    const errors: Partial<FormData> = {};
    if (!formData.department_id) {
      errors.department_id = "Please select a department.";
    }
    if (!formData.title.trim()) {
      errors.title = "Charter title is required.";
    } else if (formData.title.trim().length < 5) {
      errors.title = "Title must be at least 5 characters.";
    }
    if (!formData.content.trim()) {
      errors.content = "Charter content/description is required.";
    } else if (formData.content.trim().length < 20) {
      errors.content = "Content must be at least 20 characters.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle file input change (simulates /uploads/charters folder in PHP)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type: accept PDF and .docx Word files only
      const allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const lower = file.name.toLowerCase();
      const hasValidExt = lower.endsWith(".pdf") || lower.endsWith(".docx");
      const hasValidMime = allowed.includes(file.type);
      if (!hasValidExt && !hasValidMime) {
        setFormErrors((p) => ({
          ...p,
          file_path: "Only PDF and .docx Word files are allowed. Please save your document as .docx.",
        }));
        return;
      }
      // Validate file size: max 5MB
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((p) => ({
          ...p,
          file_path: "File size must not exceed 5MB.",
        }));
        return;
      }
      try {
        setUploadingFile(true);
        setFormErrors((p) => ({ ...p, file_path: "" }));
        const result = await api.uploadCharterFile(file);
        setFormData((p) => ({ ...p, file_path: result.file_path }));
      } catch (error) {
        setFormErrors((p) => ({
          ...p,
          file_path:
            error instanceof Error ? error.message : "Failed to upload file.",
        }));
      } finally {
        setUploadingFile(false);
      }
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      department_id: parseInt(formData.department_id),
      title: formData.title.trim(),
      content: formData.content.trim(),
      file_path: formData.file_path.trim() || null,
    };

    try {
      if (editingCharter) {
        await updateCharter(editingCharter.id, data);
        setFormSuccess("Updated successfully!");
      } else {
        await createCharter(data);
        setFormSuccess("Created successfully!");
      }

      refresh();
      setTimeout(() => {
        setFormSuccess(null);
        setFormModalOpen(false);
      }, 1500);
    } catch (error) {
      setFormSuccess(null);
      showNotification("error", error instanceof Error ? error.message : "Failed to save charter.");
    }
  };

  // Confirm delete
  const handleDelete = async () => {
    if (!deletingCharter) return;
    try {
      await deleteCharter(deletingCharter.id);
      refresh();
      setDeleteModalOpen(false);
      showNotification("success", `Charter "${deletingCharter.title}" has been deleted.`);
      setDeletingCharter(null);
    } catch (error) {
      showNotification("error", error instanceof Error ? error.message : "Failed to delete charter.");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterDept(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Page Header */}
      <div className="rounded-xl bg-white dark:bg-slate-900 px-6 py-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-slate-900 dark:text-white">Charters</h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              {charters.length} charter{charters.length !== 1 ? "s" : ""} in the
            system
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-900 text-white rounded-lg hover:bg-violet-950 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Charter
        </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 dark:border-slate-700">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search charters..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:focus:ring-slate-500"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={filterDept}
              onChange={handleFilterChange}
              className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent appearance-none cursor-pointer dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:focus:ring-slate-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {(search || filterDept) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterDept("");
                setCurrentPage(1);
              }}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm px-2 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide dark:text-slate-400">
                  Title
                </th>
                <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide hidden md:table-cell">
                  Department
                </th>
                <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide hidden lg:table-cell">
                  Date Created
                </th>
                <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide hidden xl:table-cell">
                  Last Edited By
                </th>
                <th className="text-center px-5 py-3 text-slate-500 text-xs uppercase tracking-wide w-20 dark:text-slate-400">
                  File
                </th>
                <th className="text-center px-5 py-3 text-slate-500 text-xs uppercase tracking-wide w-28 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginated.map((charter) => {
                const dept = getDepartmentById(charter.department_id);
                return (
                  <tr
                    key={charter.id}
                    className="hover:bg-slate-50 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-900 text-sm leading-snug dark:text-white">
                            {charter.title}
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                            {(charter.content ?? "").slice(0, 60)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {dept ? (
                        <span className="inline-flex items-center gap-1.5 text-blue-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs dark:text-blue-300 dark:bg-blue-950/50 dark:border-blue-800">
                          {dept.name}
                        </span>
                      ) : (
                        <span className="text-red-400 text-xs">
                          Unknown dept.
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm hidden lg:table-cell dark:text-slate-400">
                      {formatDate(charter.created_at)}
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell">
                      {charter.last_edited_by ? (
                        <span className="inline-flex items-center gap-1.5 text-violet-800 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full text-xs dark:text-violet-300 dark:bg-violet-950/50 dark:border-violet-800">
                          <User className="w-3 h-3" />
                          {charter.last_edited_by}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs dark:text-slate-600">Not edited</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {charter.file_path ? (
                        <button
                          type="button"
                          title="View attachment"
                           onClick={() => {
                            if (charter.file_path) openViewer(charter.file_path, charter.id);
                          }}
                          className="inline-flex items-center justify-center w-7 h-7 bg-violet-900 rounded-lg hover:bg-violet-950 transition-colors"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-white" />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-sm dark:text-slate-600">No attachment</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(charter)}
                          title="Edit charter"
                          className="p-2 text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors dark:text-slate-500 dark:hover:text-violet-400 dark:hover:bg-violet-950/30"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(charter)}
                          title="Delete charter"
                          className="p-2 text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors dark:text-slate-500 dark:hover:text-violet-400 dark:hover:bg-violet-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400 text-sm"
                  >
                    {search || filterDept
                      ? "No charters match the current filters."
                      : "No charters found. Click Add Charter to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add / Edit Charter Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingCharter ? "Edit Charter" : "Add New Charter"}
        size="xl"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Department Selection */}
          <div>
            <label className="block text-slate-700 mb-1.5 text-sm dark:text-slate-300">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department_id}
              onChange={(e) =>
                setFormData((p) => ({ ...p, department_id: e.target.value }))
              }
              className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer dark:bg-slate-800 dark:text-white dark:border-slate-600 ${
                formErrors.department_id ? "border-red-400" : "border-slate-300 dark:border-slate-600"
              }`}
            >
              <option value="">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {formErrors.department_id && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {formErrors.department_id}
              </p>
            )}
          </div>

          {/* Charter Title */}
          <div>
            <label className="block text-slate-700 mb-1.5 text-sm dark:text-slate-300">
              Charter Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="e.g., BPLO Citizen's Charter"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600 ${
                formErrors.title ? "border-red-400" : "border-slate-300 dark:border-slate-600"
              }`}
            />
            {formErrors.title && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {formErrors.title}
              </p>
            )}
          </div>

          {/* Charter Content */}
          <div>
            <label className="block text-slate-700 mb-1.5 text-sm dark:text-slate-300">
              Content / Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((p) => ({ ...p, content: e.target.value }))
              }
              placeholder="Describe the service, requirements, fees, processing time, and how to avail..."
              rows={8}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600 resize-y dark:bg-slate-800 dark:text-white dark:border-slate-600 font-mono ${
                formErrors.content ? "border-red-400" : "border-slate-300 dark:border-slate-600"
              }`}
            />
            <p className="text-slate-400 text-xs mt-1">
              {(formData.content ?? "").length} characters - Use line breaks for
              requirements and steps
            </p>
            {formErrors.content && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {formErrors.content}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-slate-700 mb-1.5 text-sm dark:text-slate-300">
              Attachment{" "}
              <span className="text-slate-400 text-xs">(PDF or DOCX, max 5MB)</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-slate-400 transition-colors dark:border-slate-600 dark:hover:border-slate-500">
              {formData.file_path ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Paperclip className="w-4 h-4 text-slate-600" />
                    <span className="truncate max-w-xs">{formData.file_path.split("/").pop()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, file_path: "" }))
                    }
                      className="p-1 text-slate-400 hover:text-violet-700 rounded transition-colors dark:text-slate-500 dark:hover:text-violet-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer">
                  <Paperclip className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <span className="text-slate-500 text-sm dark:text-slate-400">
                    {uploadingFile ? "Uploading file..." : "Click to upload or drag and drop"}
                  </span>
                  <span className="text-slate-400 text-xs dark:text-slate-500">PDF or DOCX</span>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploadingFile}
                  />
                </label>
              )}
            </div>
            {formErrors.file_path && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {formErrors.file_path}
              </p>
            )}
            <p className="text-slate-400 text-xs mt-1">
              In production, files are saved to /uploads/charters/ on the server
            </p>
          </div>

          {/* Form Actions */}
          {formSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {formSuccess}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-violet-950/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-violet-900 text-white rounded-lg hover:bg-violet-950 transition-colors"
            >
              {editingCharter ? "Save Changes" : "Create Charter"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Attachment Viewer */}
      <Modal
        isOpen={viewerOpen}
        onClose={closeViewer}
        title="Attachment Viewer"
        size="3xl"
      >
        {viewerError && (
          <div className="text-sm text-red-600">{viewerError}</div>
        )}
        {!viewerError && viewerType === "pdf" && (
          <div className="h-[65vh]">
            <PdfEditor fileUrl={resolveFileUrl(viewerFilePath)} />
          </div>
        )}
        {!viewerError && viewerType === "docx" && (
          <div className="h-[65vh]">
            <DocxViewer
              fileUrl={resolveFileUrl(viewerFilePath)}
              fileName={viewerFilePath.split("/").pop() || "document.docx"}
              className="h-full rounded-lg border border-slate-200 dark:border-slate-700"
              onSave={viewerCharterId ? handleSaveAttachment : undefined}
              onOpenExternal={handleOpenExternal}
            />
          </div>
        )}
        {!viewerError && viewerType === "unknown" && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Preview is not available for this file type.
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Charter"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-slate-800 text-sm">
              Are you sure you want to delete the charter{" "}
              <strong>"{deletingCharter?.title}"</strong>? This action cannot be
              undone and any associated file will also be removed.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-violet-950/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm bg-violet-900 text-white rounded-lg hover:bg-violet-950 transition-colors"
            >
              Delete Charter
            </button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={viewerSuccess}
        onClose={() => setViewerSuccess(false)}
        title="Success"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CircleCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-slate-800 text-sm">
              Document has been saved successfully.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setViewerSuccess(false)}
              className="px-4 py-2 text-sm bg-violet-900 text-white rounded-lg hover:bg-violet-950 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </Modal>

      {/* Editor Name Collection Modal */}
      <Modal
        isOpen={editorNameModalOpen}
        onClose={cancelEditorName}
        title="Editor Identification"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Please enter your name before making changes to this document. This will be recorded in the edit history.
          </p>
          <div>
            <label className="block text-slate-700 mb-1.5 text-sm dark:text-slate-300">
              Your Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={editorNameInputRef}
                type="text"
                value={editorName}
                onChange={(e) => setEditorName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={cancelEditorName}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-violet-950/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmEditorName}
              disabled={!editorName.trim()}
              className="px-4 py-2 text-sm bg-violet-900 text-white rounded-lg hover:bg-violet-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

