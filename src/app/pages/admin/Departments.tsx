/**
 * Admin Departments Page
 * Full CRUD operations for departments
 * Equivalent to PHP CRUD with PDO prepared statements
 */

import { useState, useCallback } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Building2,
  AlertCircle,
} from "lucide-react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getChartersByDepartment,
  Department,
} from "../../store/data";
import { Modal } from "../../components/Modal";
import { Pagination } from "../../components/Pagination";
import { Notification } from "../../components/Notification";

const ITEMS_PER_PAGE = 8;

interface FormData {
  name: string;
  description: string;
}

const emptyForm: FormData = { name: "", description: "" };

export function Departments() {
  const [departments, setDepartments] = useState<Department[]>(getDepartments());
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});

  // Notification
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const refresh = useCallback(() => setDepartments(getDepartments()), []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Filter departments
  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Open add form
  const openAdd = () => {
    setEditingDept(null);
    setFormData(emptyForm);
    setFormErrors({});
    setFormModalOpen(true);
  };

  // Open edit form
  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, description: dept.description });
    setFormErrors({});
    setFormModalOpen(true);
  };

  // Open delete confirmation
  const openDelete = (dept: Department) => {
    setDeletingDept(dept);
    setDeleteModalOpen(true);
  };

  // Validate form inputs (equivalent to PHP server-side validation)
  const validate = (): boolean => {
    const errors: Partial<FormData> = {};
    if (!formData.name.trim()) {
      errors.name = "Department name is required.";
    } else if (formData.name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit add/edit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim(),
    };

    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, data);
        showNotification("success", `Department "${data.name}" has been updated.`);
      } else {
        await createDepartment(data);
        showNotification("success", `Department "${data.name}" has been created.`);
      }

      refresh();
      setFormModalOpen(false);
    } catch (error) {
      showNotification("error", error instanceof Error ? error.message : "Failed to save department.");
    }
  };

  // Confirm delete
  const handleDelete = async () => {
    if (!deletingDept) return;
    try {
      await deleteDepartment(deletingDept.id);
      refresh();
      setDeleteModalOpen(false);
      showNotification("success", `Department "${deletingDept.name}" has been deleted.`);
      setDeletingDept(null);
    } catch (error) {
      showNotification("error", error instanceof Error ? error.message : "Failed to delete department.");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const charterCountForDept = (deptId: number) =>
    getChartersByDepartment(deptId).length;

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
          <h1 className="text-slate-900">Departments</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {departments.length} department{departments.length !== 1 ? "s" : ""}{" "}
            registered in the system
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-900 text-white rounded-lg hover:bg-violet-950 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide">
                  Department Name
                </th>
                <th className="text-left px-5 py-3 text-slate-500 text-xs uppercase tracking-wide hidden lg:table-cell">
                  Description
                </th>
                <th className="text-center px-5 py-3 text-slate-500 text-xs uppercase tracking-wide w-24">
                  Charters
                </th>
                <th className="text-center px-5 py-3 text-slate-500 text-xs uppercase tracking-wide w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((dept) => {
                const count = charterCountForDept(dept.id);
                return (
                  <tr
                    key={dept.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-slate-900 text-sm">
                          {dept.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm hidden lg:table-cell max-w-sm">
                      <span className="line-clamp-2">
                        {dept.description || (
                          <span className="text-slate-300 italic">
                            No description
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs ${
                          count > 0
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {count}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(dept)}
                          title="Edit department"
                          className="p-2 text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(dept)}
                          title="Delete department"
                          className="p-2 text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
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
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 text-sm"
                  >
                    {search
                      ? `No departments match "${search}".`
                      : "No departments found. Click Add Department to get started."}
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingDept ? "Edit Department" : "Add New Department"}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Department Name */}
          <div>
            <label
              htmlFor="dept-name"
              className="block text-slate-700 mb-1.5 text-sm"
            >
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              id="dept-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="e.g., Public Works Office"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                formErrors.name ? "border-red-400" : "border-slate-300"
              }`}
            />
            {formErrors.name && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {formErrors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="dept-desc"
              className="block text-slate-700 mb-1.5 text-sm"
            >
              Description
            </label>
            <textarea
              id="dept-desc"
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Brief description of the department's function and services..."
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-violet-900 text-white rounded-lg hover:bg-violet-950 transition-colors"
            >
              {editingDept ? "Save Changes" : "Create Department"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Department"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-800 text-sm">
                Are you sure you want to delete{" "}
                <strong>"{deletingDept?.name}"</strong>? This action cannot be
                undone.
              </p>
              {deletingDept &&
                charterCountForDept(deletingDept.id) > 0 && (
                  <p className="text-red-600 text-xs mt-2 bg-red-100 p-2 rounded">
                    Warning: This department has{" "}
                    {charterCountForDept(deletingDept.id)} charter(s) associated
                    with it. Those charters will remain but lose their department
                    reference.
                  </p>
                )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm bg-violet-900 text-white rounded-lg hover:bg-violet-950 transition-colors"
            >
              Delete Department
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
