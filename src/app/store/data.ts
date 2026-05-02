/**
 * Data Store - Simulates PHP/MySQL backend using localStorage
 * In production, these functions would be replaced by API calls
 * to a PHP backend with prepared statements and MySQL database
 */

export interface Department {
  id: number;
  name: string;
  description: string;
}

export interface Charter {
  id: number;
  department_id: number;
  title: string;
  content: string;
  file_path: string | null;
  created_at: string;
}

export interface Rating {
  id: number;
  charter_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

// Storage keys (equivalent to MySQL table names)
const DEPARTMENTS_KEY = "ccms_departments";
const CHARTERS_KEY = "ccms_charters";
const RATINGS_KEY = "ccms_ratings";
const AUTH_KEY = "ccms_auth";
const INITIALIZED_KEY = "ccms_initialized";

// Seed data (equivalent to INSERT INTO SQL statements)
const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 1,
    name: "Civil Registry",
    description: "Handles birth, marriage, and death registrations for all citizens of the municipality.",
  },
  {
    id: 2,
    name: "Business Permits and Licensing",
    description: "Processes new business permit applications, annual renewals, and business closures.",
  },
  {
    id: 3,
    name: "Social Welfare and Development",
    description: "Provides social protection programs, welfare services, and assistance to vulnerable sectors.",
  },
  {
    id: 4,
    name: "Engineering and Public Works",
    description: "Manages infrastructure projects, road maintenance, drainage systems, and public facilities.",
  },
  {
    id: 5,
    name: "Health Services",
    description: "Delivers primary healthcare, medical assistance, immunization, and health promotion programs.",
  },
  {
    id: 6,
    name: "Tourism and Culture",
    description: "Promotes local tourism destinations, cultural heritage preservation, and community events.",
  },
];

const INITIAL_CHARTERS: Charter[] = [
  {
    id: 1,
    department_id: 1,
    title: "Birth Certificate Issuance",
    content:
      "This service provides certified true copies of birth certificates to requesting parties.\n\nREQUIREMENTS:\n- Valid government-issued ID of the requesting party\n- Authorization letter if requesting on behalf of another person\n- Community tax certificate (cedula)\n- Payment of applicable fees\n\nFEES:\n- Regular Processing: PHP 150.00\n- Expedited Processing: PHP 300.00\n\nPROCESSING TIME:\n- Regular: 3-5 working days\n- Expedited: 1 working day\n\nHOW TO AVAIL:\n1. Secure a queue number at the Civil Registry window\n2. Submit all required documents to the receiving clerk\n3. Pay the applicable fees at the cashier\n4. Return on the scheduled release date to claim the certificate",
    file_path: "birth_certificate_requirements.pdf",
    created_at: "2024-01-15T08:00:00Z",
  },
  {
    id: 2,
    department_id: 1,
    title: "Marriage Certificate Issuance",
    content:
      "This service issues certified true copies of marriage certificates to registered parties.\n\nREQUIREMENTS:\n- Valid government-issued ID of the requesting party\n- Duly accomplished application form\n- Community tax certificate\n- Payment of applicable fees\n\nFEES:\n- Regular Processing: PHP 150.00\n- Expedited Processing: PHP 300.00\n\nPROCESSING TIME:\n- Regular: 3-5 working days\n- Expedited: 1 working day\n\nNOTE: For marriages registered in other municipalities, the request may be referred to the Philippine Statistics Authority (PSA).",
    file_path: null,
    created_at: "2024-01-16T08:00:00Z",
  },
  {
    id: 3,
    department_id: 1,
    title: "Death Certificate Issuance",
    content:
      "This service provides certified true copies of death certificates for deceased registered in this municipality.\n\nREQUIREMENTS:\n- Valid ID of the requesting party\n- Proof of relationship to the deceased (if applicable)\n- Written request letter\n- Payment of applicable fees\n\nFEES:\n- PHP 150.00 per copy\n\nPROCESSING TIME:\n- 3-5 working days",
    file_path: null,
    created_at: "2024-01-17T08:00:00Z",
  },
  {
    id: 4,
    department_id: 2,
    title: "New Business Permit Application",
    content:
      "For new business establishments seeking a Mayor's Permit to operate within the municipality.\n\nREQUIREMENTS:\n- Duly accomplished application form\n- Barangay clearance\n- DTI, SEC, or CDA registration\n- Lease contract or tax declaration of property\n- Fire Safety Inspection Certificate (FSIC)\n- Sanitary permit from the Municipal Health Office\n- Zoning clearance from the Municipal Planning Office\n\nFEES: Vary based on business capitalization and type of business activity\n\nPROCESSING TIME: 5-7 working days\n\nOFFICE HOURS: Monday to Friday, 8:00 AM to 5:00 PM",
    file_path: "business_permit_checklist.pdf",
    created_at: "2024-01-18T08:00:00Z",
  },
  {
    id: 5,
    department_id: 2,
    title: "Business Permit Annual Renewal",
    content:
      "Annual renewal of existing business permits. The renewal period runs from January 1 to January 20 of each year.\n\nREQUIREMENTS:\n- Previous year's Mayor's Permit\n- Updated barangay clearance\n- Community tax certificate\n- Proof of payment of local taxes and fees\n- Updated fire safety inspection (for qualifying businesses)\n\nPENALTIES:\n- Renewals after January 20 incur a 25% surcharge per month of delay\n\nPROCESSING TIME: 2-3 working days during renewal period",
    file_path: null,
    created_at: "2024-01-19T08:00:00Z",
  },
  {
    id: 6,
    department_id: 3,
    title: "Pantawid Pamilyang Pilipino Program (4Ps)",
    content:
      "Conditional cash transfer program providing health and education grants to poor households.\n\nELIGIBILITY CRITERIA:\n- Household must be identified as poor through the National Household Targeting System (NHTS)\n- Household must have children aged 0-18 years\n- Must commit to comply with health and education conditionalities\n\nBENEFITS:\n- Health grant: PHP 750 per month\n- Education grant: PHP 300-500 per child per month (maximum 3 children)\n\nCOMPLIANCE REQUIREMENTS:\n- Children aged 6-18 must attend school at least 85% of the time\n- Children aged 0-5 must be brought to health centers for regular check-ups\n- Pregnant women must attend pre-natal check-ups as scheduled",
    file_path: "4ps_beneficiary_guide.pdf",
    created_at: "2024-02-01T08:00:00Z",
  },
  {
    id: 7,
    department_id: 3,
    title: "Assistance to Individuals in Crisis Situation (AICS)",
    content:
      "Provides financial assistance and other forms of aid to individuals and families in crisis.\n\nCOVERAGE:\n- Medical assistance for hospitalized patients\n- Transportation assistance for displaced individuals\n- Burial assistance for indigent families\n- Food assistance for families in crisis\n\nREQUIREMENTS:\n- Duly accomplished intake form\n- Barangay certificate of residency and indigency\n- Government-issued ID\n- Supporting documents (medical certificate, death certificate, etc.)\n\nPROCESSING TIME: 1-3 working days, emergency cases are prioritized",
    file_path: null,
    created_at: "2024-02-05T08:00:00Z",
  },
  {
    id: 8,
    department_id: 4,
    title: "Road Repair and Maintenance Request",
    content:
      "Citizens may file formal requests for road repair, pothole patching, and road improvement projects.\n\nHOW TO FILE A REQUEST:\n1. Visit the Engineering Office or submit a written request\n2. Accomplish the service request form\n3. Provide specific location (barangay, street name, landmark)\n4. Describe the damage or defect clearly\n5. Include contact details for follow-up coordination\n\nPROCESS:\n- Inspection: Conducted within 5 working days from receipt\n- Priority assessment by the District Engineer\n- Scheduling based on urgency level and available budget\n- Feedback and status update within 10 working days",
    file_path: null,
    created_at: "2024-02-10T08:00:00Z",
  },
  {
    id: 9,
    department_id: 5,
    title: "Free Medical Consultation",
    content:
      "Free general medical consultation services available to all registered residents.\n\nSCHEDULE:\n- Monday to Friday: 8:00 AM to 5:00 PM\n- Walk-in consultations accepted, no appointment necessary\n- Priority lanes for senior citizens and persons with disabilities\n\nSERVICES INCLUDED:\n- General physical examination\n- Blood pressure and vital signs monitoring\n- Basic laboratory tests (CBC, urinalysis)\n- Prescription of medicines (subject to stock availability)\n- Referral to secondary or tertiary hospitals if condition requires\n\nDOCUMENTS TO BRING:\n- PhilHealth ID (if available)\n- Any previous medical records or prescriptions\n- Senior Citizen ID or PWD ID for priority service",
    file_path: null,
    created_at: "2024-02-15T08:00:00Z",
  },
  {
    id: 10,
    department_id: 5,
    title: "Immunization Program",
    content:
      "Routine immunization services for children below 1 year old and for other eligible groups.\n\nSCHEDULE:\n- Every Wednesday and Friday: 8:00 AM to 12:00 PM\n- Conducted at the Municipal Health Center and barangay health stations\n\nVACCINES PROVIDED (Free of charge):\n- BCG (Bacillus Calmette-Guerin)\n- DPT-HepB-Hib (Pentavalent vaccine)\n- OPV (Oral Polio Vaccine)\n- PCV (Pneumococcal Conjugate Vaccine)\n- MMR (Measles, Mumps, Rubella)\n\nBRING:\n- Mother and child health book\n- Birth certificate of child",
    file_path: "immunization_schedule.pdf",
    created_at: "2024-02-20T08:00:00Z",
  },
  {
    id: 11,
    department_id: 6,
    title: "Tourist Destination Registration",
    content:
      "For tourism operators and property owners wishing to register a destination or accommodation with the local tourism office.\n\nREQUIREMENTS FOR REGISTRATION:\n- Accomplished tourism accreditation form\n- Valid Mayor's Permit\n- DTI or SEC registration\n- Photos of the tourism facility or destination\n- Environmental Compliance Certificate (if applicable)\n\nBENEFITS OF REGISTRATION:\n- Inclusion in the official local tourism map and directory\n- Marketing support through official channels\n- Priority access to LGU tourism programs and events\n\nPROCESSING TIME: 7-10 working days",
    file_path: "tourism_registration_form.pdf",
    created_at: "2024-03-01T08:00:00Z",
  },
];

// Initialize localStorage with seed data on first load
function initializeData(): void {
  if (localStorage.getItem(INITIALIZED_KEY)) return;
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(INITIAL_DEPARTMENTS));
  localStorage.setItem(CHARTERS_KEY, JSON.stringify(INITIAL_CHARTERS));
  localStorage.setItem(RATINGS_KEY, JSON.stringify([]));
  localStorage.setItem(INITIALIZED_KEY, "true");
}

// =============================================================================
// DEPARTMENTS - CRUD Operations (equivalent to PHP functions with PDO queries)
// =============================================================================

export function getDepartments(): Department[] {
  initializeData();
  return JSON.parse(localStorage.getItem(DEPARTMENTS_KEY) || "[]");
}

export function getDepartmentById(id: number): Department | null {
  return getDepartments().find((d) => d.id === id) || null;
}

export function createDepartment(data: Omit<Department, "id">): Department {
  const departments = getDepartments();
  const newId =
    departments.length > 0 ? Math.max(...departments.map((d) => d.id)) + 1 : 1;
  const newDept: Department = { ...data, id: newId };
  departments.push(newDept);
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
  return newDept;
}

export function updateDepartment(
  id: number,
  data: Omit<Department, "id">
): boolean {
  const departments = getDepartments();
  const idx = departments.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  departments[idx] = { id, ...data };
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
  return true;
}

export function deleteDepartment(id: number): boolean {
  const departments = getDepartments().filter((d) => d.id !== id);
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
  return true;
}

// =============================================================================
// CHARTERS - CRUD Operations
// =============================================================================

export function getCharters(): Charter[] {
  initializeData();
  return JSON.parse(localStorage.getItem(CHARTERS_KEY) || "[]");
}

export function getCharterById(id: number): Charter | null {
  return getCharters().find((c) => c.id === id) || null;
}

export function getChartersByDepartment(departmentId: number): Charter[] {
  return getCharters().filter((c) => c.department_id === departmentId);
}

export function createCharter(data: Omit<Charter, "id" | "created_at">): Charter {
  const charters = getCharters();
  const newId =
    charters.length > 0 ? Math.max(...charters.map((c) => c.id)) + 1 : 1;
  const newCharter: Charter = {
    ...data,
    id: newId,
    created_at: new Date().toISOString(),
  };
  charters.push(newCharter);
  localStorage.setItem(CHARTERS_KEY, JSON.stringify(charters));
  return newCharter;
}

export function updateCharter(
  id: number,
  data: Partial<Omit<Charter, "id" | "created_at">>
): boolean {
  const charters = getCharters();
  const idx = charters.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  charters[idx] = { ...charters[idx], ...data };
  localStorage.setItem(CHARTERS_KEY, JSON.stringify(charters));
  return true;
}

export function deleteCharter(id: number): boolean {
  const charters = getCharters().filter((c) => c.id !== id);
  localStorage.setItem(CHARTERS_KEY, JSON.stringify(charters));
  return true;
}

// =============================================================================
// RATINGS / FEEDBACK
// =============================================================================

export function getRatings(): Rating[] {
  initializeData();
  return JSON.parse(localStorage.getItem(RATINGS_KEY) || "[]");
}

export function getRatingsByCharter(charterId: number): Rating[] {
  return getRatings().filter((r) => r.charter_id === charterId);
}

export function getAverageRating(charterId: number): number {
  const ratings = getRatingsByCharter(charterId);
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export function addRating(data: Omit<Rating, "id" | "created_at">): Rating {
  const ratings = getRatings();
  const newId =
    ratings.length > 0 ? Math.max(...ratings.map((r) => r.id)) + 1 : 1;
  const newRating: Rating = {
    ...data,
    id: newId,
    created_at: new Date().toISOString(),
  };
  ratings.push(newRating);
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  return newRating;
}

// =============================================================================
// AUTHENTICATION - Simulates PHP session-based login with password hashing
// In production: password_verify($password, $hashedPassword) with password_hash()
// =============================================================================

export function login(username: string, password: string): boolean {
  // Simulated credential check (production would use bcrypt/password_hash)
  // Default credentials: admin / admin123
  if (username === "admin" && password === "admin123") {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ loggedIn: true, username, timestamp: Date.now() })
    );
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  const auth = localStorage.getItem(AUTH_KEY);
  if (!auth) return false;
  try {
    const parsed = JSON.parse(auth);
    return parsed.loggedIn === true;
  } catch {
    return false;
  }
}

export function getAuthUser(): string | null {
  const auth = localStorage.getItem(AUTH_KEY);
  if (!auth) return null;
  try {
    return JSON.parse(auth).username || null;
  } catch {
    return null;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
