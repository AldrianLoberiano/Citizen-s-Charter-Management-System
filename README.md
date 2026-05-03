# Calauans Citizen's Charter Management System

Citizen's Charter Management System is a React + Vite frontend with an Express + MySQL backend.

## Prerequisites

- Node.js 18+
- npm
- MySQL 8.0+ or XAMPP MySQL

## Project Structure

- Frontend: root app powered by Vite
- Backend: `backend/`
- Database seed: `database/ccms_mysql.sql`
- Uploaded charter files: `uploads/charters/`

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
