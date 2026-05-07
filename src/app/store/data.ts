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
  comment: string;
  created_at: string;
}

const STORAGE_KEYS = {
  departments: "ccms_departments",
  charters: "ccms_charters",
  ratings: "ccms_ratings",
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

const seedRatings: Rating[] = [];

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

function ensureSeedData() {
  const existingDepartments = safeRead<Department[] | null>(
    STORAGE_KEYS.departments,
    null
  );
  const existingCharters = safeRead<Charter[] | null>(
    STORAGE_KEYS.charters,
    null
  );
  const existingRatings = safeRead<Rating[] | null>(
    STORAGE_KEYS.ratings,
    null
  );

  if (!existingDepartments || existingDepartments.length === 0) {
    safeWrite(STORAGE_KEYS.departments, seedDepartments);
  }
  if (!existingCharters || existingCharters.length === 0) {
    safeWrite(STORAGE_KEYS.charters, seedCharters);
  }
  if (!existingRatings) {
    safeWrite(STORAGE_KEYS.ratings, seedRatings);
  }
}

function getNextId(items: { id: number }[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((item) => item.id)) + 1;
}

function getNowIso() {
  return new Date().toISOString();
}

ensureSeedData();

let departmentsCache = safeRead<Department[]>(
  STORAGE_KEYS.departments,
  seedDepartments
);
let chartersCache = safeRead<Charter[]>(STORAGE_KEYS.charters, seedCharters);
let ratingsCache = safeRead<Rating[]>(STORAGE_KEYS.ratings, seedRatings);

function persistDepartments() {
  safeWrite(STORAGE_KEYS.departments, departmentsCache);
}

function persistCharters() {
  safeWrite(STORAGE_KEYS.charters, chartersCache);
}

function persistRatings() {
  safeWrite(STORAGE_KEYS.ratings, ratingsCache);
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

export function getDepartments(): Department[] {
  return [...departmentsCache];
}

export function getDepartmentById(id: number): Department | undefined {
  return departmentsCache.find((dept) => dept.id === id);
}

export function createDepartment(data: Omit<Department, "id" | "created_at">) {
  const newDept: Department = {
    id: getNextId(departmentsCache),
    name: data.name,
    description: data.description,
    created_at: getNowIso(),
  };
  departmentsCache = [newDept, ...departmentsCache];
  persistDepartments();
  return newDept;
}

export function updateDepartment(id: number, data: Partial<Department>) {
  departmentsCache = departmentsCache.map((dept) =>
    dept.id === id
      ? {
          ...dept,
          ...data,
          updated_at: getNowIso(),
        }
      : dept
  );
  persistDepartments();
}

export function deleteDepartment(id: number) {
  departmentsCache = departmentsCache.filter((dept) => dept.id !== id);
  const removedCharterIds = new Set(
    chartersCache.filter((c) => c.department_id === id).map((c) => c.id)
  );
  chartersCache = chartersCache.filter((c) => c.department_id !== id);
  ratingsCache = ratingsCache.filter((r) => !removedCharterIds.has(r.charter_id));
  persistDepartments();
  persistCharters();
  persistRatings();
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

export function createCharter(data: {
  department_id: number;
  title: string;
  content: string;
  file_path: string | null;
}) {
  const newCharter: Charter = {
    id: getNextId(chartersCache),
    department_id: data.department_id,
    title: data.title,
    content: data.content,
    file_path: data.file_path,
    created_at: getNowIso(),
  };
  chartersCache = [newCharter, ...chartersCache];
  persistCharters();
  return newCharter;
}

export function updateCharter(
  id: number,
  data: {
    department_id: number;
    title: string;
    content: string;
    file_path: string | null;
  }
) {
  chartersCache = chartersCache.map((charter) =>
    charter.id === id
      ? {
          ...charter,
          ...data,
          updated_at: getNowIso(),
        }
      : charter
  );
  persistCharters();
}

export function deleteCharter(id: number) {
  chartersCache = chartersCache.filter((charter) => charter.id !== id);
  ratingsCache = ratingsCache.filter((rating) => rating.charter_id !== id);
  persistCharters();
  persistRatings();
}

export function getRatings(): Rating[] {
  return [...ratingsCache];
}

export function getRatingsByCharter(charterId: number): Rating[] {
  return ratingsCache.filter((rating) => rating.charter_id === charterId);
}

export function addRating(data: {
  charter_id: number;
  rating: number;
  comment: string;
}) {
  const newRating: Rating = {
    id: getNextId(ratingsCache),
    charter_id: data.charter_id,
    rating: data.rating,
    comment: data.comment,
    created_at: getNowIso(),
  };
  ratingsCache = [...ratingsCache, newRating];
  persistRatings();
  return newRating;
}

export function getAverageRating(charterId: number) {
  const ratings = getRatingsByCharter(charterId);
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
    const fallbackOk = username === "admin" && password === "admin123";
    if (!fallbackOk) return false;
    safeWrite(STORAGE_KEYS.authUser, username);
    return true;
  }
}
