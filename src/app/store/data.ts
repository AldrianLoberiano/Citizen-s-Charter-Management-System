import { api } from "../lib/api";

export interface Department {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface Charter {
  id: number;
  department_id: number;
  title: string;
  content: string;
  file_path?: string | null;
  created_at: string;
  updated_at?: string;
  last_edited_by?: string | null;
  last_edited_at?: string | null;
}

export interface Rating {
  id: number;
  charter_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface FeedbackResponse {
  id: number;
  charter_id: number;
  name: string | null;
  email: string | null;
  contact: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface FeedbackEntry {
  uid: string;
  id: number;
  charter_id: number;
  name: string | null;
  email: string | null;
  contact: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  source: "rating" | "feedback";
}

const STORAGE_KEYS = {
  authUser: "ccms_auth_user",
} as const;

function getAuthUserFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.authUser);
    return raw ? (JSON.parse(raw) as string | null) : null;
  } catch {
    return null;
  }
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}


function getNextId(items: { id: number }[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((item) => item.id)) + 1;
}

function getNowIso() {
  return new Date().toISOString();
}

let departmentsCache: Department[] = [];
let chartersCache: Charter[] = [];
let ratingsCache: Rating[] = [];
let feedbackCache: FeedbackResponse[] = [];

export function setDepartments(departments: Department[]) {
  departmentsCache = [...departments];
}

export function setCharters(charters: Charter[]) {
  chartersCache = [...charters];
}

export function setRatings(ratings: Rating[]) {
  ratingsCache = [...ratings];
}

export function setFeedback(feedback: FeedbackResponse[]) {
  feedbackCache = [...feedback];
}

export function getDepartments(): Department[] {
  return [...departmentsCache];
}

export function getDepartmentById(id: number): Department | undefined {
  return departmentsCache.find((dept) => dept.id === id);
}

export async function createDepartment(data: Omit<Department, "id" | "created_at">) {
  const created = await api.createDepartment({
    name: data.name,
    description: data.description,
  });
  departmentsCache = [created, ...departmentsCache];
  return created;
}

export async function updateDepartment(id: number, data: Partial<Department>) {
  const updated = await api.updateDepartment(id, {
    name: data.name ?? "",
    description: data.description ?? "",
  });
  departmentsCache = departmentsCache.map((dept) =>
    dept.id === id
      ? {
          ...dept,
          ...updated,
        }
      : dept
  );
  return updated;
}

export async function deleteDepartment(id: number) {
  await api.deleteDepartment(id);
  departmentsCache = departmentsCache.filter((dept) => dept.id !== id);
  const removedCharterIds = new Set(
    chartersCache.filter((c) => c.department_id === id).map((c) => c.id)
  );
  chartersCache = chartersCache.filter((c) => c.department_id !== id);
  ratingsCache = ratingsCache.filter((r) => !removedCharterIds.has(r.charter_id));
  feedbackCache = feedbackCache.filter((r) => !removedCharterIds.has(r.charter_id));
}

export function getCharters(): Charter[] {
  return [...chartersCache];
}

export function getCharterById(id: number): Charter | undefined {
  return chartersCache.find((charter) => charter.id === id);
}

export function getChartersByDepartment(deptId: number): Charter[] {
  return chartersCache.filter((charter) => charter.department_id === deptId);
}

export async function createCharter(data: {
  department_id: number;
  title: string;
  content: string;
  file_path: string | null;
}) {
  const created = await api.createCharter({
    department_id: data.department_id,
    title: data.title,
    content: data.content,
    file_path: data.file_path,
  });
  chartersCache = [created, ...chartersCache];
  return created;
}

export async function updateCharter(
  id: number,
  data: {
    department_id: number;
    title: string;
    content: string;
    file_path: string | null;
  }
) {
  const updated = await api.updateCharter(id, data);
  chartersCache = chartersCache.map((charter) =>
    charter.id === id
      ? {
          ...charter,
          ...updated,
        }
      : charter
  );
  return updated;
}

export async function deleteCharter(id: number) {
  await api.deleteCharter(id);
  chartersCache = chartersCache.filter((charter) => charter.id !== id);
  ratingsCache = ratingsCache.filter((rating) => rating.charter_id !== id);
  feedbackCache = feedbackCache.filter((rating) => rating.charter_id !== id);
}

export function updateCharterFilePath(id: number, filePath: string) {
  chartersCache = chartersCache.map((charter) =>
    charter.id === id ? { ...charter, file_path: filePath } : charter
  );
}

export function getRatings(): Rating[] {
  return [...ratingsCache];
}

export function getRatingsByCharter(charterId: number): Rating[] {
  return ratingsCache.filter((rating) => rating.charter_id === charterId);
}

export function getFeedback(): FeedbackResponse[] {
  return [...feedbackCache];
}

export function getFeedbackByCharter(charterId: number): FeedbackResponse[] {
  return feedbackCache.filter((rating) => rating.charter_id === charterId);
}

function createFeedbackUid(entry: {
  source: "rating" | "feedback";
  id: number;
  charter_id: number;
  created_at?: string;
}) {
  return `${entry.source}-${entry.id}-${entry.charter_id}-${entry.created_at ?? ""}`;
}

export function getCombinedFeedback(): FeedbackEntry[] {
  const ratingEntries: FeedbackEntry[] = ratingsCache.map((rating) => ({
    uid: createFeedbackUid({
      source: "rating",
      id: rating.id,
      charter_id: rating.charter_id,
      created_at: rating.created_at,
    }),
    id: rating.id,
    charter_id: rating.charter_id,
    name: null,
    email: null,
    contact: null,
    rating: rating.rating,
    comment: rating.comment ?? null,
    created_at: rating.created_at,
    source: "rating",
  }));

  const feedbackEntries: FeedbackEntry[] = feedbackCache.map((feedback) => ({
    uid: createFeedbackUid({
      source: "feedback",
      id: feedback.id,
      charter_id: feedback.charter_id,
      created_at: feedback.created_at,
    }),
    id: feedback.id,
    charter_id: feedback.charter_id,
    name: feedback.name ?? null,
    email: feedback.email ?? null,
    contact: feedback.contact ?? null,
    rating: feedback.rating,
    comment: feedback.comment ?? null,
    created_at: feedback.created_at,
    source: "feedback",
  }));

  return [...ratingEntries, ...feedbackEntries];
}

export function getCombinedFeedbackByCharter(charterId: number): FeedbackEntry[] {
  return getCombinedFeedback().filter((entry) => entry.charter_id === charterId);
}

export async function addFeedback(data: {
  charter_id: number;
  name: string;
  email: string;
  contact: string;
  rating: number;
  comment: string;
}) {
  const created = await api.addFeedback(data.charter_id, {
    name: data.name,
    email: data.email,
    contact: data.contact,
    rating: data.rating,
    comment: data.comment,
  });
  feedbackCache = [...feedbackCache, created];
  return created;
}

export function getAverageRating(charterId: number) {
  const ratings = getCombinedFeedbackByCharter(charterId);
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

export function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getAuthUser(): string | null {
  return safeRead<string | null>(STORAGE_KEYS.authUser, null);
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthUser());
}

export function logout() {
  safeWrite(STORAGE_KEYS.authUser, null);
}

export async function loginWithApi(username: string, password: string) {
  try {
    const response = await api.login(username, password);
    if (response && typeof response === "object" && "success" in response) {
      if (response.success === false) return false;
    }
    const resolvedUser =
      typeof response === "object" && response
        ? (response as { user?: { username?: string }; username?: string })
            .user?.username ||
          (response as { username?: string }).username ||
          username
        : username;
    safeWrite(STORAGE_KEYS.authUser, resolvedUser);
    return true;
  } catch {
    return false;
  }
}
