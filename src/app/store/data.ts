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
  departments: "ccms_departments",
  charters: "ccms_charters",
  ratings: "ccms_ratings",
  feedback: "ccms_feedback",
  authUser: "ccms_auth_user",
} as const;

const seedDepartments: Department[] = [
  {
    id: 1,
    name: "Municipal Health Office",
    description: "Health services, maternal care, and community wellness programs.",
    created_at: "2024-01-15T08:00:00.000Z",
  },
  {
    id: 2,
    name: "Municipal Engineering Office",
    description: "Building permits, infrastructure coordination, and public works.",
    created_at: "2024-01-18T08:00:00.000Z",
  },
  {
    id: 3,
    name: "Treasurer's Office",
    description: "Collections, business permits, and revenue management.",
    created_at: "2024-01-22T08:00:00.000Z",
  },
];

const seedCharters: Charter[] = [
  {
    id: 1,
    department_id: 1,
    title: "Issuance of Health Certificate",
    content:
      "REQUIREMENTS\n- Valid ID\n- Barangay clearance\n\nPROCESSING TIME\n- 30 minutes\n\nFEES\n- PHP 50.00",
    file_path: null,
    created_at: "2024-02-01T08:00:00.000Z",
  },
  {
    id: 2,
    department_id: 2,
    title: "Building Permit Application",
    content:
      "REQUIREMENTS\n- Application form\n- Building plans\n- Zoning clearance\n\nPROCESSING TIME\n- 5 working days",
    file_path: null,
    created_at: "2024-02-03T08:00:00.000Z",
  },
  {
    id: 3,
    department_id: 3,
    title: "Business Permit Renewal",
    content:
      "REQUIREMENTS\n- Previous permit\n- Barangay clearance\n- Tax clearance\n\nPROCESSING TIME\n- 1 day",
    file_path: null,
    created_at: "2024-02-05T08:00:00.000Z",
  },
];

const seedFeedback: FeedbackResponse[] = [];
const seedRatings: Rating[] = [];

function getAuthUserFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.authUser);
    return raw ? (JSON.parse(raw) as string | null) : null;
  } catch {
    return null;
  }
}

function getScopedKey(key: string) {
  const user = getAuthUserFromStorage();
  return user ? `${key}:${user}` : key;
}

function safeRead<T>(key: string, fallback: T, scoped = false): T {
  if (typeof window === "undefined") return fallback;
  try {
    const storageKey = scoped ? getScopedKey(key) : key;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T, scoped = false) {
  if (typeof window === "undefined") return;
  try {
    const storageKey = scoped ? getScopedKey(key) : key;
    window.localStorage.setItem(storageKey, JSON.stringify(value));
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

let departmentsCache = safeRead<Department[]>(
  STORAGE_KEYS.departments,
  [],
  true
);
let chartersCache = safeRead<Charter[]>(STORAGE_KEYS.charters, [], true);
let ratingsCache = safeRead<Rating[]>(STORAGE_KEYS.ratings, [], true);
let feedbackCache = safeRead<FeedbackResponse[]>(STORAGE_KEYS.feedback, [], true);

function persistDepartments() {
  safeWrite(STORAGE_KEYS.departments, departmentsCache, true);
}

function persistCharters() {
  safeWrite(STORAGE_KEYS.charters, chartersCache, true);
}

function persistRatings() {
  safeWrite(STORAGE_KEYS.ratings, ratingsCache, true);
}

function persistFeedback() {
  safeWrite(STORAGE_KEYS.feedback, feedbackCache, true);
}

export function setDepartments(departments: Department[]) {
  departmentsCache = [...departments];
  persistDepartments();
}

export function setCharters(charters: Charter[]) {
  chartersCache = [...charters];
  persistCharters();
}

export function setRatings(ratings: Rating[]) {
  ratingsCache = [...ratings];
  persistRatings();
}

export function setFeedback(feedback: FeedbackResponse[]) {
  feedbackCache = [...feedback];
  persistFeedback();
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
  persistDepartments();
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
  persistDepartments();
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
  persistDepartments();
  persistCharters();
  persistRatings();
  persistFeedback();
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
  persistCharters();
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
  persistCharters();
  return updated;
}

export async function deleteCharter(id: number) {
  await api.deleteCharter(id);
  chartersCache = chartersCache.filter((charter) => charter.id !== id);
  ratingsCache = ratingsCache.filter((rating) => rating.charter_id !== id);
  feedbackCache = feedbackCache.filter((rating) => rating.charter_id !== id);
  persistCharters();
  persistRatings();
  persistFeedback();
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
  persistFeedback();
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
  const currentUser = getAuthUserFromStorage();
  if (currentUser && typeof window !== "undefined") {
    window.localStorage.removeItem(`${STORAGE_KEYS.departments}:${currentUser}`);
    window.localStorage.removeItem(`${STORAGE_KEYS.charters}:${currentUser}`);
    window.localStorage.removeItem(`${STORAGE_KEYS.ratings}:${currentUser}`);
    window.localStorage.removeItem(`${STORAGE_KEYS.feedback}:${currentUser}`);
  }
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
