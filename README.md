# Calauans Citizen's Charter Management System

Citizen's Charter Management System is a React + Vite frontend with an Express + MySQL backend.

## Prerequisites

- Node.js 18+
- npm
- MySQL 8.0+ or XAMPP MySQL

## Project Structure

```text
Citizen’s Charter Management System/
├─ backend/
│  ├─ db.js
│  ├─ package.json
│  └─ server.js
├─ database/
│  ├─ ccms_mysql.sql
│  └─ mysql_connection_example.js
├─ public/
│  └─ images/
│     └─ header/
├─ src/
│  ├─ app/
│  │  ├─ components/
│  │  │  ├─ AdminLayout.tsx
│  │  │  ├─ ClientLayout.tsx
│  │  │  ├─ LogoLoop.tsx
│  │  │  ├─ Modal.tsx
│  │  │  ├─ Notification.tsx
│  │  │  ├─ Pagination.tsx
│  │  │  ├─ figma/
│  │  │  └─ ui/
│  │  ├─ lib/
│  │  │  └─ api.ts
│  │  ├─ pages/
│  │  │  ├─ admin/
│  │  │  │  ├─ Charters.tsx
│  │  │  │  ├─ Dashboard.tsx
│  │  │  │  ├─ Departments.tsx
│  │  │  │  └─ Login.tsx
│  │  │  └─ client/
│  │  │     ├─ CharterDetail.tsx
│  │  │     ├─ DepartmentPage.tsx
│  │  │     └─ Home.tsx
│  │  ├─ store/
│  │  │  ├─ apiSync.ts
│  │  │  └─ data.ts
│  │  └─ routes.tsx
│  ├─ styles/
│  │  ├─ fonts.css
│  │  ├─ index.css
│  │  ├─ tailwind.css
│  │  └─ theme.css
│  ├─ main.tsx
│  └─ vite-env.d.ts
├─ uploads/
│  └─ charters/
├─ index.html
├─ package.json
├─ postcss.config.mjs
├─ README.md
└─ vite.config.ts
```

- `src/` contains the React frontend.
- `backend/` contains the Express API and MySQL connection logic.
- `database/` contains the SQL schema and sample connection script.
- `public/images/header/` stores the header and logo assets used by the client UI.
- `uploads/charters/` stores uploaded charter documents served by the backend.

### Directory Purpose

| Path                    | Purpose                                               |
| ----------------------- | ----------------------------------------------------- |
| `backend/`              | Express API, MySQL access, and server startup code    |
| `database/`             | SQL schema, seed data, and connection example         |
| `public/images/header/` | Header artwork and logo assets                        |
| `src/app/components/`   | Shared UI layouts, dialogs, pagination, and logo loop |
| `src/app/pages/client/` | Public-facing pages for citizens                      |
| `src/app/pages/admin/`  | Admin dashboard, login, departments, and charters     |
| `src/app/store/`        | Local data store and API sync helpers                 |
| `src/styles/`           | Global CSS, fonts, theme, and Tailwind entry files    |
| `uploads/charters/`     | Uploaded PDF and document files                       |

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

## API Behavior

The frontend syncs with the backend API and can fall back to local storage when the API is unavailable. Main API routes include departments, charters, ratings, authentication, and charter file uploads.

## Upload Storage

Uploaded files are stored on disk in `uploads/charters/`. The backend returns and stores relative paths such as `uploads/charters/document.pdf`.

## Default Admin Login

- Username: `admin`
- Password: `admin123`

## Database Notes

The imported SQL file creates the `ccms_db` database with `departments`, `charters`, and `ratings` tables plus seed data for initial testing.
