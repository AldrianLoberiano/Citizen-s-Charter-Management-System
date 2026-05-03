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
  QrCode,
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
  const [selectedCharter, setSelectedCharter] = useState<Charter | null>(null);

  // Form
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [uploadingFile, setUploadingFile] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const feedbackUrl = editingCharter
    ? `${window.location.origin}/charter/${editingCharter.id}#feedback-form`
              {paginated.map((charter) => {
                const dept = getDepartmentById(charter.department_id);
                return (
                  <tr key={charter.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {charter.id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                        <div>
                          <p className="text-sm leading-snug text-slate-900">
                            {charter.title}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                            {charter.content.slice(0, 60)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-4 md:table-cell">
                      {paginated.map((charter) => {
                        const dept = getDepartmentById(charter.department_id);
                        return (
                          <tr key={charter.id} className="transition-colors hover:bg-slate-50">
                            <td className="px-5 py-4 text-sm text-slate-400">
                              {charter.id}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-start gap-2">
                                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                                <div>
                                  <p className="text-sm leading-snug text-slate-900">
                                    {charter.title}
                                  </p>
                                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                                    {charter.content.slice(0, 60)}...
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="hidden px-5 py-4 md:table-cell">
                              {dept ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                                  {dept.name}
                                </span>
                              ) : (
                                <span className="text-xs text-red-400">Unknown dept.</span>
                              )}
                            </td>
                            <td className="hidden px-5 py-4 text-sm text-slate-500 lg:table-cell">
                              {formatDate(charter.created_at)}
                            </td>
                            <td className="px-5 py-4 text-center">
                              {charter.file_path ? (
                                <div
                                  title={charter.file_path}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 transition-colors hover:bg-slate-200"
                                >
                                  <Paperclip className="h-3.5 w-3.5 text-slate-700" />
                                </div>
                              ) : (
                                <span className="text-sm text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setSelectedCharter(charter)}
                                  title="View details"
                                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openEdit(charter)}
                                  title="Edit charter"
                                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openDelete(charter)}
                                  title="Delete charter"
                                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
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
                            className="px-6 py-12 text-center text-sm text-slate-400"
                          >
                            {search || filterDept
                              ? "No charters match the current filters."
                              : "No charters found. Click Add Charter to create one."}
                          </td>
                        </tr>
                      )}
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-slate-900">Charters</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {charters.length} charter{charters.length !== 1 ? "s" : ""} in the
            system
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Add Charter
        </button>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search charters..."
              value={search}
              onChange={handleSearchChange}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={filterDept}
              onChange={handleFilterChange}
              className="cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
              className="flex items-center gap-1 px-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-12 px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500">
                  ID
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500">
                  Title
                </th>
                <th className="hidden px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 md:table-cell">
                  Department
                </th>
                <th className="hidden px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 lg:table-cell">
                  Date Created
                </th>
                <th className="w-20 px-5 py-3 text-center text-xs uppercase tracking-wide text-slate-500">
                  File
                </th>
                <th className="w-28 px-5 py-3 text-center text-xs uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((charter) => {
                const dept = getDepartmentById(charter.department_id);
                return (
                  <tr key={charter.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {charter.id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                        <div>
                          <p className="text-sm leading-snug text-slate-900">
                            {charter.title}
                          </p>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="w-12 px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500">
                          </p>
                        </div>
                            <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500">
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                            <th className="hidden px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 md:table-cell">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                          {dept.name}
                            <th className="hidden px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500 lg:table-cell">
                      ) : (
                        <span className="text-xs text-red-400">
                            <th className="w-20 px-5 py-3 text-center text-xs uppercase tracking-wide text-slate-500">
                        </span>
                      )}
                            <th className="w-28 px-5 py-3 text-center text-xs uppercase tracking-wide text-slate-500">
                    <td className="hidden px-5 py-4 text-sm text-slate-500 lg:table-cell">
                      {formatDate(charter.created_at)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {charter.file_path ? (
                        <div
                          title={charter.file_path}
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-slate-100 transition-colors hover:bg-slate-200"
                              <tr key={charter.id} className="transition-colors hover:bg-slate-50">
                                <td className="px-5 py-4 text-sm text-slate-400">
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                                    <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                          onClick={() => setSelectedCharter(charter)}
                                      <p className="text-sm leading-snug text-slate-900">
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                        </button>
                        <button
                          onClick={() => openEdit(charter)}
                          title="Edit charter"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                        <button
                          onClick={() => openDelete(charter)}
                          title="Delete charter"
                                    <span className="text-xs text-red-400">
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                                <td className="hidden px-5 py-4 text-sm text-slate-500 lg:table-cell">
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td
                                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-slate-100 transition-colors hover:bg-slate-200"
                    className="px-6 py-12 text-center text-slate-400 text-sm"
                                      <Paperclip className="h-3.5 w-3.5 text-slate-700" />
                    {search || filterDept
                      ? "No charters match the current filters."
                                    <span className="text-sm text-slate-300">—</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

                                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        <Pagination
                                      <FileText className="h-4 w-4" />
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
                                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      </div>
                                      <Pencil className="h-4 w-4" />
      {/* Add / Edit Charter Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
                                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        size="xl"
                                      <Trash2 className="h-4 w-4" />
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
              className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
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
              className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono ${
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
                    <Paperclip className="w-4 h-4 text-green-600" />
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
              className="px-4 py-2 text-sm bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
            >
              {editingCharter ? "Save Changes" : "Create Charter"}
            </button>
          </div>

          {editingCharter && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-4 h-4 text-blue-700" />
                <h4 className="text-slate-900">Citizen Feedback QR Code</h4>
              </div>
              <p className="text-slate-500 text-xs mb-4">
                Share this QR code so citizens can open the charter feedback page.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-3">
                  <img
                    src={feedbackQrUrl}
                    alt={`QR code for ${editingCharter.title}`}
                    className="h-44 w-44"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <label className="block text-slate-700 mb-1.5 text-sm">
                    Feedback link
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={feedbackUrl}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-600"
                  />
                  <p className="text-slate-400 text-xs mt-1">
                    Use this QR code on posters, desks, or printed service materials.
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Selected charter right-hand sidebar */}
      {selectedCharter && (
        <aside className="fixed right-6 top-24 w-80 z-50">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-slate-900 text-sm">{selectedCharter.title}</h4>
                <p className="text-slate-400 text-xs">Charter #{selectedCharter.id}</p>
              </div>
              <button
                onClick={() => setSelectedCharter(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-500 mb-3">Share this QR for the citizen feedback form</div>
            <div className="flex items-center gap-3">
              <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-2">
                <img src={selectedFeedbackQrUrl} alt={`QR ${selectedCharter.title}`} className="h-36 w-36" />
              </div>
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  readOnly
                  value={selectedFeedbackUrl}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600"
                />
                <div className="flex gap-2 mt-2">
                  <a
                    href={selectedFeedbackUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-700 hover:underline"
                  >
                    Open link
                  </a>
                  <button
                    onClick={() => navigator.clipboard?.writeText(selectedFeedbackUrl)}
                    className="text-xs text-slate-600 hover:text-slate-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

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
