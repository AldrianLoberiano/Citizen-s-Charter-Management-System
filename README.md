# Calauan Citizen's Charter Management System

A full-stack web application for publishing citizen service charters by department, managing charter documents (PDF and DOCX), and collecting citizen feedback with analytics. Built for the Municipality of Calauan, Laguna.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4, Radix UI, MUI, Recharts, Lucide icons
- **Backend:** Express 5, Node.js, MySQL (mysql2), Multer (file uploads), bcryptjs (auth)
- **Document Processing:** mammoth.js (DOCX → HTML), pdf-lib (PDF export), pdfjs-dist (PDF rendering), docx (DOCX generation)
- **Testing:** Vitest, React Testing Library, Supertest
- **Deployment:** Vercel (frontend), Render (backend), MySQL (Railway)

## Purpose

- Publish and maintain citizen service charters by department.
- Provide a public-facing portal for charter browsing and details.
- Collect feedback and ratings with basic analytics for admins.
- Support document uploads, editing, and local backup/recovery workflows.

## Features

### Citizen (Client-facing)

- **Home page** (`/`)
  - Live clock display, API-loaded department stats, and service highlights.
- **Department → Services listing** (`/department/:id`)
  - Shows all published charters per department with search.
- **Charter Details** (`/charter/:id`)
  - Renders charter content with preserved line breaks.
  - **PDF attachment preview** (iframe) with `HEAD` check for availability.
  - **DOCX attachment rendering** via `DocxViewer` (read-only, HTML conversion via mammoth.js).
  - **Citizen Feedback** section:
    - Fields: full name (required), email (optional), contact (optional)
    - Star rating (1–5) + optional comment
    - Submits to the backend and updates the displayed list/average rating.
  - **Feedback QR code** on the charter page encodes:
    - `/charter/:id#feedback-form` (scanning takes users directly to the form)

### Admin (Dashboard)

- **Admin layout**
  - Auth-gated admin routes, sidebar navigation, and dark/light theme toggle.
- **Dashboard**
  - Summary cards (departments, charters, attachments, total feedback)
  - Recent charters table and quick-link navigation.
- **Charters management**
  - Full CRUD for charters
  - **PDF and DOCX uploads** (charter attachment)
  - **Editor Identification**: before editing any charter document, the system requires the editor to enter their name. This name is recorded in the edit history for accountability.
  - **PDF Annotation Editor** (`PdfEditor`):
    - Text tool: add text annotations with configurable color/size
    - Draw tool: freehand drawing with configurable color/stroke
    - Highlight tool: rectangular highlight regions
    - Select tool: edit existing text annotations
    - Page navigation, zoom (50%–400%), clear annotations, export annotated PDF
  - **DOCX Viewer/Editor** (`DocxViewer`):
    - Renders `.docx` files as HTML via mammoth.js
    - `contentEditable` inline editing mode
    - Undo/Redo with full history stack (Ctrl+Z / Ctrl+Y)
    - Save edited content back to server as new DOCX (Ctrl+S)
    - Zoom controls (50%–200%), print, download original
  - **Edit history**: tracks all saved versions with editor name, metadata, and timestamps
  - Search, department filtering, pagination
- **Edited Charters** (`/admin/edited-charters`)
  - Centralized view of all edited charter documents
  - Search by charter name or department
  - Open or download any edited version
- **Feedback management**
  - Filters (Department / Charter / Rating) + search
  - **Charts**:
    - Rating breakdown (bar style, SVG)
    - Source breakdown (legacy rating vs QR/form) (pie style, SVG)
    - Per-question breakdown visualizations (Google Sheets integration)
  - **CSV export** (downloads a local `.csv` file from filtered results)
  - **Feedback Form QR** modal:
    - Generates QR that points to the citizen in-app feedback form
    - Includes **Copy link** button
- **Backup & Recovery**
  - SQL dump download and restore from uploaded `.sql` files
  - Import database schema via admin endpoint

## Prerequisites

- Node.js 18+
- npm
- MySQL 8.0+ or XAMPP MySQL

## Project Structure

```text
Citizen's Charter Management System/
├─ frontend/
│  ├─ .env                        # Dev environment variables
│  ├─ .env.production             # Production environment variables
│  ├─ index.html
│  ├─ package.json
│  ├─ postcss.config.mjs
│  ├─ tsconfig.json
│  ├─ vercel.json
│  ├─ vite.config.ts
│  ├─ public/
│  │  └─ images/
│  │     ├─ header/               # Logos, header images, municipality, mayor
│  │     └─ (department images)
│  └─ src/
│     ├─ env.d.ts
│     ├─ main.tsx
│     ├─ test-setup.ts
│     ├─ app/
│     │  ├─ App.tsx
│     │  ├─ routes.tsx
│     │  ├─ components/
│     │  │  ├─ AdminLayout.tsx
│     │  │  ├─ ClientLayout.tsx
│     │  │  ├─ DocxViewer.tsx     # DOCX viewer/editor (mammoth.js + docx)
│     │  │  ├─ LogoLoop.tsx
│     │  │  ├─ Modal.tsx
│     │  │  ├─ Notification.tsx
│     │  │  ├─ Pagination.tsx
│     │  │  └─ PdfEditor.tsx      # PDF annotation editor (pdfjs-dist + pdf-lib)
│     │  ├─ lib/
│     │  │  ├─ api.ts
│     │  │  └─ api.test.ts
│     │  ├─ pages/
│     │  │  ├─ admin/
│     │  │  │  ├─ BackupRecovery.tsx
│     │  │  │  ├─ Charters.tsx
│     │  │  │  ├─ Dashboard.tsx
│     │  │  │  ├─ Departments.tsx
│     │  │  │  ├─ EditedCharters.tsx
│     │  │  │  ├─ Feedback.tsx
│     │  │  │  └─ Login.tsx
│     │  │  └─ client/
│     │  │     ├─ CharterDetail.tsx
│     │  │     ├─ DepartmentPage.tsx
│     │  │     └─ Home.tsx
│     │  └─ store/
│     │     ├─ apiSync.ts
│     │     ├─ data.ts
│     │     └─ data.test.ts
│     └─ styles/
│        ├─ fonts.css
│        ├─ index.css
│        ├─ tailwind.css
│        └─ theme.css
├─ backend/
│  ├─ .env                        # Backend environment variables
│  ├─ .env.example                # Environment variable template
│  ├─ .env.production             # Production environment variables
│  ├─ create-table.js             # Migration script for charter_pdf_edits table
│  ├─ db.js                       # MySQL connection pool
│  ├─ package.json
│  ├─ server.js                   # Express API server (855 lines)
│  ├─ vitest.config.js
│  ├─ database/
│  │  ├─ ccms_db.sql              # Full MySQL database dump
│  │  └─ mysql_connection_example.js
│  └─ tests/
│     └─ server.test.js
├─ uploads/
│  ├─ charters/                   # Uploaded charter documents (PDF + DOCX)
│  ├─ edited-charters/            # Saved edited charter versions
│  └─ backups/                    # Uploaded .sql backup files
├─ render.yaml                    # Render deployment config
└─ README.md
```

### Directory Purpose

| Path | Purpose |
| ---- | ------- |
| `frontend/` | React SPA with Vite, TypeScript, and Tailwind CSS |
| `frontend/src/app/components/` | Shared UI: layouts, dialogs, pagination, PDF/DOCX viewers |
| `frontend/src/app/lib/` | API client and helpers |
| `frontend/src/app/pages/client/` | Public-facing pages for citizens |
| `frontend/src/app/pages/admin/` | Admin dashboard, login, departments, charters, edited charters |
| `frontend/src/app/store/` | Local data store and API sync helpers |
| `frontend/public/images/` | Department and header images |
| `frontend/src/styles/` | Global CSS, fonts, theme, and Tailwind entry files |
| `backend/` | Express API, MySQL access, and server startup code |
| `backend/database/` | MySQL database dump and connection example script |
| `backend/tests/` | Backend test suite (Vitest) |
| `uploads/charters/` | Uploaded PDF and DOCX charter files |
| `uploads/edited-charters/` | Saved edited charter versions |
| `uploads/backups/` | Uploaded `.sql` files used for restore |

## Setup

1. Install frontend dependencies:
   ```bash
   cd frontend && npm install
   ```
2. Install backend dependencies:
   ```bash
   cd backend && npm install
   ```
3. Import the database schema and seed data:
   ```bash
   mysql -u root -p < backend/database/ccms_db.sql
   ```

## Run the App

Start the backend in one terminal:

```bash
cd backend && node server.js
```

Start the frontend in another terminal:

```bash
cd frontend && npm run dev
```

The frontend runs on `http://localhost:5173` and the backend runs on `http://localhost:4000` by default.

## Deployment

### Vercel (Frontend)

This project is a single-page app (SPA). Vercel needs a rewrite so routes like `/admin` return `index.html`.

1. Deploy the `frontend/` directory to Vercel from the repo root.
2. Set the environment variable `VITE_PROD_BASE_URL` in Vercel to your deployed backend base URL, e.g.:
   - `https://your-backend.onrender.com`
3. Ensure the backend allows your Vercel domain in CORS (`CORS_ORIGIN` env var).

Notes:

- The SPA rewrite is configured in `frontend/vercel.json`.
- Environment variables for production are in `frontend/.env.production`.

### Render (Backend)

The backend is deployed to Render using the `render.yaml` configuration.

1. Connect the repository to Render.
2. Render will automatically detect the `render.yaml` and deploy the `backend/` service.
3. Set environment variables in Render dashboard matching `backend/.env.production`.
4. The backend runs on `https://ccms-backend.onrender.com` in production.

### Localhost Deployment (Local Only)

Use these steps to run the system locally on `localhost` without any public hosting.

1. Start MySQL locally (XAMPP or MySQL service).
2. Create and seed the database:
   ```bash
   mysql -u root -p < backend/database/ccms_db.sql
   ```
3. (Optional) Create `backend/.env` if you need custom ports or DB credentials:
   ```
   PORT=4000
   CORS_ORIGIN=http://localhost:5173
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=ccms_db
   ```
4. Install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
5. Start the backend API:
   ```bash
   cd backend && node server.js
   ```
6. Start the frontend (new terminal):
   ```bash
   cd frontend && npm run dev
   ```
7. Open the app:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:4000`

Notes:

- This setup is for local development only and is not exposed outside your machine.
- If you change the frontend port, update `CORS_ORIGIN` in `backend/.env`.

## Troubleshooting (Localhost)

- Backend won't start: verify MySQL is running and credentials in `backend/.env` match.
- CORS error in browser: ensure `CORS_ORIGIN` matches the frontend URL.
- Frontend shows no data: confirm `http://localhost:4000/api/health` returns `{ "ok": true }`.
- File uploads fail: ensure `uploads/charters/` exists and is writable.

## Database Backup and Recovery (Localhost)

Create a backup (dump) of the local database:

```bash
mysqldump -u root -p ccms_db > backup_ccms_db.sql
```

Restore from a backup file:

```bash
mysql -u root -p ccms_db < backup_ccms_db.sql
```

Tips:

- Store backups outside the project folder.
- Use a timestamped filename: `backup_ccms_db_YYYYMMDD.sql`.

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `VITE_ENV` | Environment mode | `development` |
| `VITE_DEV_BASE_URL` | Backend URL in development | `http://localhost:4000` |
| `VITE_PROD_BASE_URL` | Backend URL in production | `https://ccms-backend.onrender.com` |

### Backend (`backend/.env`)

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `PORT` | Backend port | `4000` |
| `CORS_ORIGIN` | Allowed frontend origins (comma-separated) | `http://localhost:5173` |
| `DB_HOST` | MySQL host | `127.0.0.1` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | (empty) |
| `DB_NAME` | Database name | `ccms_db` |
| `DB_SSL` | Enable SSL for MySQL | `false` |
| `DB_POOL_SIZE` | Connection pool size | `10` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `admin123` |

## Key Backend Endpoints

- Health check:
  - `GET /api/health`
- Departments:
  - `GET /api/departments`
  - `GET /api/departments/:id`
  - `POST /api/departments`
  - `PUT /api/departments/:id`
  - `DELETE /api/departments/:id`
- Charters:
  - `GET /api/charters?departmentId=...`
  - `GET /api/charters/:id`
  - `POST /api/charters`
  - `PUT /api/charters/:id`
  - `DELETE /api/charters/:id`
- Charter edits and attachments:
  - `POST /api/charters/:id/save-edit` — save admin-edited charter file
  - `GET /api/charters/:id/edits` — get edit history for a charter
  - `GET /api/edited-charters` — list all edited charters
  - `POST /api/charters/:id/attachment` — replace charter attachment
- Ratings / legacy and feedback responses:
  - `GET /api/ratings`
  - `GET /api/charters/:id/ratings`
  - `POST /api/charters/:id/ratings`
  - `GET /api/feedback`
  - `GET /api/charters/:id/feedback`
  - `POST /api/charters/:id/feedback`
- File uploads:
  - `POST /api/uploads/charters` (PDF and DOCX) → stores in `uploads/charters/`
  - `POST /api/charters/:id/edited-pdfs` (PDF and DOCX) → stores in `uploads/edited-charters/` and inserts into `charter_pdf_edits`
- Admin:
  - `GET /api/admin/backup` (streams `.sql`)
  - `POST /api/admin/restore` (restores from uploaded `.sql`)
  - `POST /api/admin/import-schema` (imports database schema)
- Authentication:
  - `POST /api/auth/login`

## Upload Storage

Files are stored locally on the server (disk) in these folders:

- `uploads/charters/` — uploaded charter PDFs and DOCX files
- `uploads/edited-charters/` — uploaded edited PDFs and DOCX files
- `uploads/backups/` — uploaded `.sql` files used for restore

The backend serves files under:

- `/uploads/*` (via `express.static`)
