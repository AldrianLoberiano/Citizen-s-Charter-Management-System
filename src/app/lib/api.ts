const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path: string, options?: RequestInit) {
  const rawUser = typeof window === "undefined" ? null : window.localStorage.getItem("ccms_auth_user");
  const adminUsername = rawUser ? JSON.parse(rawUser) : null;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(adminUsername ? { "x-admin-username": adminUsername } : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function upload(path: string, formData: FormData) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Upload failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getDepartments: () => request("/departments"),
  getCharters: () => request("/charters"),
  getRatings: (charterId: number) => request(`/charters/${charterId}/ratings`),
  getFeedback: () => request("/feedback"),
  getCharterFeedback: (charterId: number) => request(`/charters/${charterId}/feedback`),
  login: (username: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  createDepartment: (payload: { name: string; description: string }) =>
    request("/departments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDepartment: (id: number, payload: { name: string; description: string }) =>
    request(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteDepartment: (id: number) => request(`/departments/${id}`, { method: "DELETE" }),
  createCharter: (payload: {
    department_id: number;
    title: string;
    content: string;
    file_path: string | null;
  }) =>
    request("/charters", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCharter: (
    id: number,
    payload: {
      department_id: number;
      title: string;
      content: string;
      file_path: string | null;
    }
  ) =>
    request(`/charters/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteCharter: (id: number) => request(`/charters/${id}`, { method: "DELETE" }),
  addRating: (charterId: number, payload: { rating: number; comment: string }) =>
    request(`/charters/${charterId}/ratings`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  addFeedback: (
    charterId: number,
    payload: {
      name: string;
      email: string;
      contact: string;
      rating: number;
      comment: string;
    }
  ) =>
    request(`/charters/${charterId}/feedback`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  uploadCharterFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return upload("/uploads/charters", formData);
  },
};
