# Calauans Citizen's Charter Management System

Citizen's Charter Management System is a full-stack web app for publishing service charters, managing departments, and collecting citizen feedback, built with a React + Vite frontend and an Express + MySQL backend.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Radix UI, MUI, Recharts, Lucide icons
- **Backend:** Express 5, Node.js, MySQL (mysql2), Multer (file uploads), bcryptjs (auth)
- **Document Processing:** mammoth.js (DOCX→HTML), pdf-lib (PDF export), pdfjs-dist (PDF rendering), docx (DOCX generation)
- **Testing:** Vitest, React Testing Library
- **Deployment:** Vercel (frontend), local Node.js (backend)

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
  - **Edit history**: tracks all saved versions with metadata and timestamps
  - Search, department filtering, pagination
- **Edited Charters** (`/admin/edited-charters`)
- **Feedback management**
  - Filters (Department / Charter / Rating) + search
  - **Charts**:
    - Rating breakdown (bar style, SVG)
    - Source breakdown (legacy rating vs QR/form) (pie style, SVG)
  - **CSV export** (downloads a local `.csv` file from filtered results)
  - **Feedback Form QR** modal:
    - Generates QR that points to the citizen in-app feedback form
    - Includes **Copy link** button

### Document workflows

- Admin backend supports:
  - Uploading charter PDFs
  - Uploading **edited charter PDFs** and recording metadata
  - Local **Backup & Recovery** (SQL dump/restore)

## Prerequisites

- Node.js 18+
- npm
- MySQL 8.0+ or XAMPP MySQL

## Project Structure

```text
Citizen's Charter Management System/
├─ backend/
│  ├─ .env.example
│  ├─ db.js
│  ├─ package.json
│  ├─ server.js
│  ├─ vitest.config.js
│  └─ tests/
│     └─ server.test.js
├─ database/
│  └─ mysql_connection_example.js
├─ dist/
├─ src/
│  ├─ env.d.ts
│  ├─ main.tsx
│  ├─ test-setup.ts
│  ├─ vite-env.d.ts
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ routes.tsx
│  │  ├─ components/
│  │  │  ├─ AdminLayout.tsx
│  │  │  ├─ ClientLayout.tsx
│  │  │  ├─ LogoLoop.tsx
│  │  │  ├─ Modal.tsx
│  │  │  ├─ Modal.test.tsx
│  │  │  ├─ Notification.tsx
│  │  │  ├─ Pagination.tsx
│  │  │  └─ Pagination.test.tsx
│  │  ├─ lib/
│  │  │  ├─ api.ts
│  │  │  └─ api.test.ts
│  │  ├─ pages/
│  │  │  ├─ admin/
│  │  │  │  ├─ BackupRecovery.tsx
│  │  │  │  ├─ Charters.tsx
│  │  │  │  ├─ Dashboard.tsx
│  │  │  │  ├─ Departments.tsx
│  │  │  │  ├─ Feedback.tsx
│  │  │  │  └─ Login.tsx
│  │  │  └─ client/
│  │  │     ├─ CharterDetail.tsx
│  │  │     ├─ DepartmentPage.tsx
│  │  │     └─ Home.tsx
│  │  └─ store/
│  │     ├─ apiSync.ts
│  │     ├─ data.ts
│  │     └─ data.test.ts
│  ├─ public/
│  │  └─ images/
│  │     ├─ header/
│  │     │  └─ (logos and header images)
│  │     └─ (department images)
│  └─ styles/
│     ├─ fonts.css
│     ├─ index.css
│     ├─ tailwind.css
│     └─ theme.css
├─ uploads/
│  └─ charters/
├─ index.html
├─ package.json
├─ postcss.config.mjs
├─ README.md
├─ tsconfig.json
├─ vercel.json
└─ vite.config.ts
```

- `src/` contains the React frontend.
- `backend/` contains the Express API, MySQL connection logic, and tests.
- `database/` contains the sample connection script.
- `dist/` is the production build output (generated by `npm run build`).
- `uploads/charters/` stores uploaded charter documents served by the backend.
- `src/public/images/` holds department and header images.

### Directory Purpose

| Path                         | Purpose                                               |
| ---------------------------- | ----------------------------------------------------- |
| `backend/`                   | Express API, MySQL access, and server startup code    |
| `backend/tests/`             | Backend test suite (Vitest)                           |
| `database/`                  | Connection example script                             |
| `dist/`                      | Production frontend build output                      |
| `src/app/components/`        | Shared UI layouts, dialogs, pagination, and logo loop |
| `src/app/lib/`               | API client and helpers                                |
| `src/app/pages/client/`      | Public-facing pages for citizens                      |
| `src/app/pages/admin/`       | Admin dashboard, login, departments, and charters     |
| `src/app/store/`             | Local data store and API sync helpers                 |
| `src/public/images/`         | Department and header images                          |
| `src/styles/`                | Global CSS, fonts, theme, and Tailwind entry files    |
| `uploads/charters/`          | Uploaded PDF and document files                       |

## Setup

1. Install frontend dependencies from the project root:
   `npm install`
2. Install backend dependencies:
   `cd backend && npm install`
3. Import the database schema and seed data:
   `mysql -u root -p < database/ccms_mysql.sql`

## Run the App

Start the backend in one terminal:

`npm run server`

Start the frontend in another terminal:

`npm run dev`

The frontend runs on `http://localhost:5173` and the backend runs on `http://localhost:4000` by default.

## Deployment (Vercel)

This project is a single-page app (SPA). Vercel needs a rewrite so routes like `/admin` return `index.html`.

1. Deploy the frontend to Vercel from the repo root.
2. Set the environment variable `VITE_API_URL` in Vercel to your deployed backend base URL, e.g.:
   - `https://your-backend.example.com/api`
3. Ensure the backend allows your Vercel domain in CORS.

Notes:

- The frontend cannot call `http://localhost:4000` from Vercel; you must deploy the backend.
- The SPA rewrite is configured in `vercel.json`.

## Localhost Deployment (Local Only)

Use these steps to run the system locally on `localhost` without any public hosting.

1. Start MySQL locally (XAMPP or MySQL service).
2. Create and seed the database:
   `mysql -u root -p < database/ccms_mysql.sql`
3. (Optional) Create `backend/.env` if you need custom ports or DB credentials:
   - `PORT=4000`
   - `CORS_ORIGIN=http://localhost:5173`
   - `DB_HOST=127.0.0.1`
   - `DB_PORT=3306`
   - `DB_USER=root`
   - `DB_PASSWORD=`
   - `DB_NAME=ccms_db`
4. Install dependencies:
   - Frontend: `npm install`
   - Backend: `cd backend && npm install`
5. Start the backend API:
   `npm run server`
6. Start the frontend (new terminal):
   `npm run dev`
7. Open the app:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:4000`

Notes:

- This setup is for local development only and is not exposed outside your machine.
- If you change the frontend port, update `CORS_ORIGIN` in `backend/.env`.

## Troubleshooting (Localhost)

- Backend won’t start: verify MySQL is running and credentials in `backend/.env` match.
- CORS error in browser: ensure `CORS_ORIGIN` matches the frontend URL.
- Frontend shows no data: confirm `http://localhost:4000/api/health` returns `{ "ok": true }`.
- File uploads fail: ensure `uploads/charters/` exists and is writable.

## Database Backup and Recovery (Localhost)

Create a backup (dump) of the local database:

`mysqldump -u root -p ccms_db > backup_ccms_db.sql`

Restore from a backup file:

`mysql -u root -p ccms_db < backup_ccms_db.sql`

Tips:

- Store backups outside the project folder.
- Use a timestamped filename: `backup_ccms_db_YYYYMMDD.sql`.

## Environment Variables

Backend `backend/.env` can override the defaults used by `backend/server.js` and `backend/db.js`:

- `PORT` - backend port, default `4000`
- `CORS_ORIGIN` - allowed frontend origin, default `http://localhost:5173`
- `DB_HOST` - MySQL host, default `127.0.0.1`
- `DB_PORT` - MySQL port, default `3306`
- `DB_USER` - MySQL user, default `root`
- `DB_PASSWORD` - MySQL password, default empty
- `DB_NAME` - database name, default `ccms_db`
- `ADMIN_USERNAME` - default `admin`
- `ADMIN_PASSWORD` - default `admin123`

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
- Ratings / legacy and feedback responses:
  - `GET /api/ratings`
  - `GET /api/charters/:id/ratings`
  - `POST /api/charters/:id/ratings`
  - `GET /api/feedback`
  - `GET /api/charters/:id/feedback`
  - `POST /api/charters/:id/feedback`
- File uploads:
  - `POST /api/uploads/charters` (PDF only) → stores in `uploads/charters/`
  - `POST /api/charters/:id/edited-pdfs` (PDF only) → stores in `uploads/edited-charters/` and inserts into `charter_pdf_edits`
- Admin backup & recovery:
  - `GET /api/admin/backup` (streams `.sql`)
  - `POST /api/admin/restore` (restores from uploaded `.sql`)
- Authentication:
  - `POST /api/auth/login`

## Upload Storage

Files are stored locally on the server (disk) in these folders:

- `uploads/charters/` — uploaded charter PDFs
- `uploads/edited-charters/` — uploaded edited PDFs
- `uploads/backups/` — uploaded `.sql` files used for restore

The backend serves files under:

- `/uploads/*` (via `express.static`)

