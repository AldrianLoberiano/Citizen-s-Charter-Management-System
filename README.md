# Calauan Citizen's Charter Management System (CCMS)

A full-stack web application for publishing citizen service charters by department, managing charter documents (PDF and DOCX) with built-in editors, collecting citizen feedback with analytics, and supporting database backup/recovery. Built for the Municipality of Calauan, Laguna.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS v4, Radix UI, MUI, Recharts, Lucide Icons |
| **Backend** | Express 5, Node.js 18+, MySQL (mysql2), Multer (file uploads), bcryptjs (auth) |
| **Document Processing** | mammoth.js (DOCX to HTML), pdfjs-dist (PDF rendering), pdf-lib (PDF annotation/export), docx (DOCX generation), JSZip (DOCX in-place editing) |
| **Testing** | Vitest, React Testing Library, Supertest |
| **Deployment** | Vercel (frontend), Render (backend), MySQL (Railway) |

## Purpose

- Publish and maintain citizen service charters by department.
- Provide a public-facing portal for charter browsing, document preview, and feedback submission.
- Enable administrators to manage departments, charters, and document edits with full version history.
- Support document uploads, inline PDF/DOCX editing, and database backup/recovery workflows.

## Features

### Citizen Portal (Client-Facing)

- **Home Page** (`/`)
  - Hero section with ARTA, Calauan, and Bagong Pilipinas logos side by side with welcome message.
  - Department grid with search and clickable cards.
  - Statistics banner showing department and charter counts.
  - Infinite-scrolling logo carousel of department logos.
  - "How to Use" guide section for citizens.
  - **Feedback and Complaints** section with:
    - How to send feedback (Client Satisfaction Measurement Form).
    - How to file a complaint (Client Complaint Form with required details).
    - Contact information for inquiries and complaints.
    - External contact information (LPAO, ARTA, Presidential Complaints Center, Contact Center ng Bayan).

- **Department Page** (`/department/:id`)
  - Lists all published charters for the selected department.
  - Search bar to filter charters by title or content.

- **Charter Detail** (`/charter/:id`)
  - Full charter content with preserved formatting.
  - PDF attachment preview (embedded iframe viewer).
  - DOCX attachment viewer via `DocxViewer` (read-only HTML rendering).
  - **Citizen Feedback Form**:
    - Full name (required), email (optional), contact number (optional).
    - Interactive star rating (1-5) with visual feedback.
    - Optional comment/text feedback.
    - Submits directly to backend and updates the displayed rating average.
  - Feedback QR code encoding the direct feedback form URL.

### Admin Dashboard

- **Authentication** (`/admin/login`)
  - Username/password login with show/hide password toggle.
  - Session persisted in browser localStorage.
  - Default credentials: `admin` / `admin123`.

- **Dashboard** (`/admin/dashboard`)
  - Summary cards: total departments, charters, attachments, and feedback count.
  - Recent charters table with quick navigation.
  - Quick-link cards to major admin sections.

- **Department Management** (`/admin/departments`)
  - Full CRUD operations via modal forms.
  - Search and paginated listing.
  - Charter count displayed per department.
  - Delete protection warning when charters are associated.

- **Charter Management** (`/admin/charters`)
  - Full CRUD for charters with department selection.
  - **File Upload**: PDF and DOCX attachments (max 5MB).
  - **Editor Identification**: requires editor name before modifying documents (recorded in edit history for accountability).
  - **PDF Annotation Editor** (`PdfEditor`):
    - Text tool: add text annotations with configurable color and size.
    - Draw tool: freehand drawing with configurable color and stroke width.
    - Highlight tool: rectangular highlight regions.
    - Select tool: edit existing text annotations.
    - Page navigation, zoom (50%-400%), clear all annotations.
    - Export annotated PDF with all annotations embedded.
  - **DOCX Viewer/Editor** (`DocxViewer`):
    - Renders DOCX files as formatted HTML via mammoth.js.
    - Inline contentEditable editing mode.
    - Undo/Redo with full history stack (Ctrl+Z / Ctrl+Y).
    - Save edited content back to server as DOCX (Ctrl+S).
    - Zoom controls (50%-200%) and print (admin only).
    - Supports complex table structures and formatting.
  - **Edit History**: tracks all saved versions with editor name, metadata, and timestamps.
  - Search, department filtering, and pagination.

- **Edited Charters** (`/admin/edited-charters`)
  - Centralized view of all edited charter documents.
  - Search by charter name or department.
  - Open or download any edited version.
  - **Delete button** with modal confirmation popup.
  - **Pagination**: Shows 50 items at a time with "Show More" button.

- **Feedback Management** (`/admin/feedback`)
  - Filters: by department, charter, and star rating.
  - Search across feedback content.
  - **Charts and Analytics**:
    - Rating breakdown bar chart (SVG).
    - Source breakdown (legacy ratings vs. QR/form feedback).
    - Google Sheets integration with per-question breakdown visualizations.
    - Gender, age group, and client type pie charts.
  - **CSV Export**: downloads filtered feedback as a local CSV file.
  - **Feedback Form QR Code** modal:
    - Generates QR code pointing to the citizen feedback form.
    - Copy-to-clipboard link button.

- **Backup & Recovery** (`/admin/backup`)
  - SQL backup download (complete database dump).
  - SQL restore from uploaded `.sql` file.
  - Schema import from `database/ccms_db.sql`.
  - Drag-and-drop upload zone with confirmation dialog.

## Project Structure

```text
Citizen's Charter Management System/
├── .gitignore
├── package.json                     # Root scripts (dev:all, dev:backend, dev:frontend)
├── README.md
├── render.yaml                      # Render deployment config (backend)
│
├── backend/
│   ├── .env                         # Local environment variables
│   ├── .env.example                 # Environment variable template
│   ├── .env.production              # Production environment variables
│   ├── package.json                 # Express 5, mysql2, multer, bcryptjs
│   ├── server.js                    # Express API server
│   ├── db.js                        # MySQL2 connection pool
│   ├── create-table.js              # Migration: charter_pdf_edits table
│   ├── vitest.config.js             # Backend test configuration
│   ├── tests/
│   │   └── server.test.js           # Supertest integration tests
│   └── database/
│       ├── ccms_db.sql              # Full MySQL database dump
│       └── mysql_connection_example.js
│
├── frontend/
│   ├── .env                         # Dev environment variables (Vite)
│   ├── .env.production              # Production environment variables
│   ├── index.html                   # HTML entry point
│   ├── package.json                 # React 18, Radix UI, MUI, Recharts
│   ├── vite.config.ts               # Vite + React + Tailwind v4
│   ├── tsconfig.json                # TypeScript config
│   ├── postcss.config.mjs           # PostCSS (Tailwind plugin)
│   ├── vercel.json                  # SPA rewrite for Vercel
│   ├── public/
│   │   └── images/
│   │       ├── header/              # Logos, municipality banner, mayor photo
│   │       └── (department images)  # BPLO, MTO, MPDC, MHO, etc.
│   ├── uploads/                     # File storage
│   │   ├── charters/                # Uploaded PDF/DOCX charter files
│   │   ├── edited-charters/         # Saved edited charter versions
│   │   └── backups/                 # Uploaded SQL restore files
│   └── src/
│       ├── main.tsx                 # App bootstrap and API sync
│       ├── env.d.ts                 # Vite env type declarations
│       ├── test-setup.ts            # Vitest setup (jest-dom)
│       ├── styles/
│       │   ├── index.css            # Main CSS entry
│       │   ├── fonts.css            # Font declarations
│       │   ├── tailwind.css         # Tailwind v4 configuration
│       │   └── theme.css            # CSS custom properties, light/dark themes
│       └── app/
│           ├── App.tsx              # Root component with RouterProvider
│           ├── routes.tsx           # React Router route definitions
│           ├── components/
│           │   ├── AdminLayout.tsx   # Auth-gated admin shell with sidebar
│           │   ├── ClientLayout.tsx  # Public header/footer layout
│           │   ├── Modal.tsx         # Reusable modal (sm-3xl sizes)
│           │   ├── Notification.tsx  # Toast notifications
│           │   ├── Pagination.tsx    # Page navigation with ellipsis
│           │   ├── PdfEditor.tsx     # PDF annotation editor
│           │   ├── DocxViewer.tsx    # DOCX viewer/editor
│           │   ├── docxFallback.ts   # HTML-to-DOCX generation
│           │   └── LogoLoop.tsx      # Infinite scrolling logos
│           ├── lib/
│           │   ├── api.ts           # HTTP client (fetch wrapper)
│           │   └── api.test.ts      # API client tests
│           ├── pages/
│           │   ├── admin/
│           │   │   ├── Login.tsx         # Admin login
│           │   │   ├── Dashboard.tsx     # Stats and overview
│           │   │   ├── Departments.tsx   # Department CRUD
│           │   │   ├── Charters.tsx      # Charter CRUD + editors
│           │   │   ├── EditedCharters.tsx # Edited charter history
│           │   │   ├── Feedback.tsx      # Feedback analytics
│           │   │   └── BackupRecovery.tsx # DB backup/restore
│           │   └── client/
│           │       ├── Home.tsx          # Public home page
│           │       ├── DepartmentPage.tsx # Department listing
│           │       └── CharterDetail.tsx  # Charter detail + feedback
│           └── store/
│               ├── data.ts          # In-memory data cache
│               ├── data.test.ts     # Data store tests
│               └── apiSync.ts       # API polling sync
│
└── README.md
```

### Directory Reference

| Path | Purpose |
| --- | --- |
| `frontend/` | React SPA with Vite, TypeScript, and Tailwind CSS |
| `frontend/src/app/components/` | Shared UI components: layouts, modals, pagination, PDF/DOCX viewers |
| `frontend/src/app/lib/` | API client and helpers |
| `frontend/src/app/pages/client/` | Public-facing pages for citizens |
| `frontend/src/app/pages/admin/` | Admin dashboard, login, departments, charters, feedback, backup |
| `frontend/src/app/store/` | In-memory data cache and API sync |
| `frontend/public/images/` | Department logos, header banners, official images |
| `frontend/src/styles/` | Global CSS, fonts, theme tokens, Tailwind entry |
| `frontend/uploads/` | Uploaded files (charters, edited charters, backups) |
| `backend/` | Express API server, MySQL connection, and startup code |
| `backend/database/` | MySQL database dump and connection example |
| `backend/tests/` | Backend integration test suite |

## Database Schema

| Table | Purpose |
| --- | --- |
| `admins` | Admin user accounts (username, bcrypt password hash) |
| `departments` | Department records (name, description, owner) |
| `charters` | Charter records (title, content, file_path, department FK) |
| `ratings` | Legacy citizen ratings (1-5 stars, optional comment) |
| `feedback_responses` | Primary citizen feedback (name, email, contact, rating, comment) |
| `charter_pdf_edits` | Edit history for charter documents (file path, editor, metadata) |

## API Endpoints

### Health

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Admin login (username + password) |

### Departments

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/departments` | List all departments |
| `GET` | `/api/departments/:id` | Get single department |
| `POST` | `/api/departments` | Create department |
| `PUT` | `/api/departments/:id` | Update department |
| `DELETE` | `/api/departments/:id` | Delete department |

### Charters

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/charters` | List charters (optional `?departmentId=X`) |
| `GET` | `/api/charters/:id` | Get single charter |
| `POST` | `/api/charters` | Create charter |
| `PUT` | `/api/charters/:id` | Update charter |
| `DELETE` | `/api/charters/:id` | Delete charter |

### Charter Files and Edits

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/uploads/charters` | Upload charter PDF/DOCX |
| `POST` | `/api/charters/:id/attachment` | Replace charter attachment |
| `POST` | `/api/charters/:id/save-edit` | Save admin-edited DOCX |
| `POST` | `/api/charters/:id/edited-pdfs` | Submit edited PDF with metadata |
| `GET` | `/api/charters/:id/edits` | Get edit history for a charter |
| `GET` | `/api/edited-charters` | List all edited charters |
| `DELETE` | `/api/edited-charters/:id` | Delete an edited charter (file + record) |

### Ratings and Feedback

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/ratings` | List all ratings |
| `GET` | `/api/charters/:id/ratings` | Get ratings for a charter |
| `POST` | `/api/charters/:id/ratings` | Submit a rating |
| `GET` | `/api/feedback` | List all feedback responses |
| `GET` | `/api/charters/:id/feedback` | Get feedback for a charter |
| `POST` | `/api/charters/:id/feedback` | Submit feedback |

### Admin Backup/Restore

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/backup` | Download SQL backup dump |
| `POST` | `/api/admin/restore` | Restore from uploaded `.sql` file (uses mysql CLI) |
| `POST` | `/api/admin/restore-sql` | Restore from raw SQL in request body |
| `POST` | `/api/admin/import-schema` | Import schema from default SQL |

## Prerequisites

- Node.js 18+
- npm
- MySQL 8.0+ (or XAMPP MySQL)

## Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd Citizen-s-Charter-Management-System
   ```

2. **Install frontend dependencies**:
   ```bash
   cd frontend && npm install
   ```

3. **Install backend dependencies**:
   ```bash
   cd ../backend && npm install
   ```

4. **Import the database schema and seed data**:
   ```bash
   mysql -u root -p < backend/database/ccms_db.sql
   ```

5. **Configure environment variables** (optional for local):
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your MySQL credentials
   ```

## Run the App

**Prerequisites**: Start WAMP/XAMPP to ensure MySQL is running on port 3306.

**Start both backend and frontend** with a single command:
```bash
npm run dev:all
```

This runs the backend (`localhost:4000`) and frontend (`localhost:5173`) concurrently using `concurrently`. Output is color-coded (blue for backend, green for frontend).

**Or run them separately**:

Start the backend in one terminal:
```bash
cd backend && npm run dev
```

Start the frontend in another terminal:
```bash
cd frontend && npm run dev
```

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:4000` |
| MySQL (WAMP) | `127.0.0.1:3306` |

## Testing

**Run backend tests** (Supertest integration tests):
```bash
cd backend && npm test
```

**Run frontend tests** (Vitest + React Testing Library):
```bash
cd frontend && npm test
```

**Run tests in watch mode** (auto-rerun on file changes):
```bash
cd backend && npm run test:watch
cd frontend && npm run test:watch
```

## Deployment

### Vercel (Frontend)

1. Deploy the `frontend/` directory to Vercel.
2. Set `VITE_API_URL` to your deployed backend API URL (e.g., `https://your-backend.onrender.com/api`).
3. Ensure the backend allows your Vercel domain in CORS (`CORS_ORIGIN` env var).
4. SPA rewrite is configured in `frontend/vercel.json`.

### Render (Backend)

1. Connect the repository to Render.
2. Render auto-detects `render.yaml` and deploys the backend service.
3. Set environment variables in the Render dashboard matching `backend/.env.production`.

### Localhost

See [Setup](#setup) above. This configuration is for local development only.

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:4000/api` |
| `VITE_GSHEETS_API_KEY` | Google Sheets API key for analytics | (set in .env) |
| `VITE_GSHEETS_SPREADSHEET_ID` | Google Sheets spreadsheet ID | (set in .env) |
| `VITE_GSHEETS_SHEET_NAME` | Google Sheets sheet name | `Form Responses 1` |
| `VITE_GSHEETS_RANGE` | Google Sheets data range | `A:Z` |
| `VITE_HOME_ROUTE` | Home page route | `/` |
| `VITE_ADMIN_ROUTE` | Admin base route | `/admin` |
| `VITE_ADMIN_DASHBOARD_ROUTE` | Admin dashboard route | `/admin/dashboard` |
| `VITE_ADMIN_DEPARTMENTS_ROUTE` | Admin departments route | `/admin/departments` |
| `VITE_ADMIN_CHARTERS_ROUTE` | Admin charters route | `/admin/charters` |
| `VITE_ADMIN_EDITED_CHARTERS_ROUTE` | Admin edited charters route | `/admin/edited-charters` |
| `VITE_ADMIN_FEEDBACK_ROUTE` | Admin feedback route | `/admin/feedback` |
| `VITE_ADMIN_BACKUP_ROUTE` | Admin backup route | `/admin/backup` |
| `VITE_DEPARTMENTS_ROUTE` | API departments endpoint | `/departments` |
| `VITE_CHARTERS_ROUTE` | API charters endpoint | `/charters` |
| `VITE_EDITED_CHARTERS_ROUTE` | API edited charters endpoint | `/edited-charters` |
| `VITE_RATINGS_ROUTE` | API ratings endpoint | `/ratings` |
| `VITE_FEEDBACK_ROUTE` | API feedback endpoint | `/feedback` |
| `VITE_AUTH_LOGIN_ROUTE` | API login endpoint | `/auth/login` |
| `VITE_AUTH_LOGOUT_ROUTE` | API logout endpoint | `/auth/logout` |

### Backend (`backend/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Backend port (auto-increments if in use) | `4000` |
| `CORS_ORIGIN` | Allowed frontend origins (comma-separated) | `http://localhost:5173,http://localhost:5174` |
| `ALLOW_ALL_ORIGINS` | Allow all CORS origins | `false` |
| `DB_HOST` | MySQL host | `127.0.0.1` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | (empty) |
| `DB_NAME` | Database name | `ccms_db` |
| `DB_SSL` | Enable SSL for MySQL | `false` |
| `DB_POOL_SIZE` | Connection pool size | `10` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `admin123` |
| `MYSQL_BIN` | Path to mysql CLI binary for restore | `mysql` |
| `EDITED_CHARTERS_RETENTION_DAYS` | Days to retain edited charters (unused) | `30` |

## Upload Storage

Files are stored on the server disk in:

| Directory | Contents |
| --- | --- |
| `frontend/uploads/charters/` | Uploaded charter PDFs and DOCX files |
| `frontend/uploads/edited-charters/` | Saved edited charter versions |
| `frontend/uploads/backups/` | Uploaded `.sql` restore files |

The backend serves files under `/uploads/*` via `express.static`.

## Troubleshooting

| Issue | Solution |
| --- | --- |
| Backend won't start | Verify MySQL is running and credentials in `backend/.env` match |
| CORS error in browser | Ensure `CORS_ORIGIN` matches the frontend URL |
| Frontend shows no data | Confirm `http://localhost:4000/api/health` returns `{ "ok": true }` |
| File uploads fail | Ensure `frontend/uploads/charters/` exists and is writable |
| Save edit fails | Restart the backend server after any path changes |
| 500 on upload endpoints | Restart the backend to reload configuration |

## License

Built for the Municipality of Calauan, Laguna.