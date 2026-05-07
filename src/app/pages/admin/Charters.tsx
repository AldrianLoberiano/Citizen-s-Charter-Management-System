/**
 * Admin Charters Page
 * Full CRUD operations for Citizen's Charters
 * Includes file upload simulation, department selection, and pagination
 */

import { useState, useCallback } from "react";
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
} from "lucide-react";
import {
  getCharters,
  getDepartments,
  getDepartmentById,
  createCharter,
  updateCharter,
  deleteCharter,
  Charter,
  Department,
  formatDate,
} from "../../store/data";
import { api } from "../../lib/api";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import { Notification } from "../../components/Notification";

const ITEMS_PER_PAGE = 8;

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

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingCharter, setEditingCharter] = useState<Charter | null>(null);
  const [deletingCharter, setDeletingCharter] = useState<Charter | null>(null);

  // Form
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [uploadingFile, setUploadingFile] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const refresh = useCallback(() => setCharters(getCharters()), []);

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
    setFormModalOpen(true);
  };

  // Open delete modal
  const openDelete = (charter: Charter) => {
    setDeletingCharter(charter);
    setDeleteModalOpen(true);
  };

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
      // Validate file type: accept Excel and PDF files only
      const allowed = [
      if (!allowed.includes(file.type)) {
        setFormErrors((p) => ({
          ...p,
          file_path: "Only PDF and image files are allowed.",
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      department_id: parseInt(formData.department_id),
      title: formData.title.trim(),
      content: formData.content.trim(),
      file_path: formData.file_path.trim() || null,
    };

    if (editingCharter) {
      updateCharter(editingCharter.id, data);
      showNotification("success", `Charter "${data.title}" has been updated.`);
    } else {
      createCharter(data);
      showNotification("success", `Charter "${data.title}" has been created.`);
    }

    refresh();
    setFormModalOpen(false);
  };

  // Confirm delete
  const handleDelete = () => {
    if (!deletingCharter) return;
    deleteCharter(deletingCharter.id);
    refresh();
    setDeleteModalOpen(false);
    showNotification("success", `Charter "${deletingCharter.title}" has been deleted.`);
    setDeletingCharter(null);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-slate-900">Charters</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {charters.length} charter{charters.length !== 1 ? "s" : ""} in the
            system
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Charter
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search charters..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={filterDept}
              onChange={handleFilterChange}
              className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent appearance-none cursor-pointer"
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
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm px-2"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide w-12">
                  ID
                </th>
                <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide">
                  Title
                </th>
                <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide hidden md:table-cell">
                  Department
                </th>
                <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide hidden lg:table-cell">
                  Date Created
                </th>
                <th className="text-center px-5 py-3 text-slate-500 text-xs uppercase tracking-wide w-20">
                  File
                </th>
                <th className="text-center px-5 py-3 text-slate-500 text-xs uppercase tracking-wide w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((charter) => {
                const dept = getDepartmentById(charter.department_id);
                return (
                  <tr
                    key={charter.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-4 text-slate-400 text-sm">
                      {charter.id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-900 text-sm leading-snug">
                            {charter.title}
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                            {charter.content.slice(0, 60)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {dept ? (
                        <span className="inline-flex items-center gap-1.5 text-blue-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs">
                          {dept.name}
                        </span>
                      ) : (
                        <span className="text-red-400 text-xs">
                          Unknown dept.
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm hidden lg:table-cell">
                      {formatDate(charter.created_at)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {charter.file_path ? (
                        <div
                          title={charter.file_path}
                          className="inline-flex items-center justify-center w-7 h-7 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-green-700" />
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(charter)}
                          title="Edit charter"
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(charter)}
                          title="Delete charter"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            <label className="block text-slate-700 mb-1.5 text-sm">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department_id}
              onChange={(e) =>
                setFormData((p) => ({ ...p, department_id: e.target.value }))
              }
              className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer ${
                formErrors.department_id ? "border-red-400" : "border-slate-300"
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
            <label className="block text-slate-700 mb-1.5 text-sm">
              Charter Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="e.g., Birth Certificate Issuance"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                formErrors.title ? "border-red-400" : "border-slate-300"
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
            <label className="block text-slate-700 mb-1.5 text-sm">
              Content / Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((p) => ({ ...p, content: e.target.value }))
              }
              placeholder="Describe the service, requirements, fees, processing time, and how to avail..."
              rows={8}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 resize-y font-mono ${
                formErrors.content ? "border-red-400" : "border-slate-300"
              }`}
            />
            <p className="text-slate-400 text-xs mt-1">
              {formData.content.length} characters — Use line breaks for
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
            <label className="block text-slate-700 mb-1.5 text-sm">
              Attachment{" "}
              <span className="text-slate-400 text-xs">(PDF or Image, max 5MB)</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-slate-400 transition-colors">
              {formData.file_path ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Paperclip className="w-4 h-4 text-slate-600" />
                    <span className="truncate max-w-xs">{formData.file_path}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, file_path: "" }))
                    }
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer">
                  <Paperclip className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-500 text-sm">
                    {uploadingFile ? "Uploading file..." : "Click to upload or drag and drop"}
                  </span>
                  <span className="text-slate-400 text-xs">PDF, JPG, PNG, GIF</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
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
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              {editingCharter ? "Save Changes" : "Create Charter"}
            </button>
          </div>
        </form>
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
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Charter
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

