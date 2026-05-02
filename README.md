# Calauans Citizen's Charter Management System

Citizen's Charter Management System frontend built with React + Vite.

## Prerequisites

- Node.js 18+
- npm
- MySQL 8.0+ (or XAMPP MySQL)

## Install and Run

1. Install dependencies:
   npm install
2. Start the development server:
   npm run dev

## MySQL Database Setup

The project includes a ready-to-import SQL file:

- database/ccms_mysql.sql

Create and import the database:

1. Open MySQL terminal
2. Run:
   mysql -u root -p < database/ccms_mysql.sql

This creates:

- ccms_db database
- admins, departments, charters, ratings tables
- sample seed data

## Upload Storage Path

Uploaded files should be saved on disk in:

- uploads/charters/

Store only the relative file path in MySQL, for example:

- uploads/charters/document.pdf

## Admin Access

Default seeded admin account:

- username: admin
- password: admin123

## Notes

- Current frontend data uses local storage in development.
- For full MERN integration, connect your backend API to ccms_db and replace local storage calls with HTTP requests.
