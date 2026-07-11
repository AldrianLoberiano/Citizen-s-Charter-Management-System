# Calauan Citizen's Charter Management System (CCMS) - User Manual

**Version 1.1**
**For the Municipality of Calauan, Laguna**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Citizen Portal (Public)](#3-citizen-portal-public)
4. [Admin Dashboard](#4-admin-dashboard)
5. [Department Management](#5-department-management)
6. [Charter Management](#6-charter-management)
7. [Document Editors](#7-document-editors)
8. [Feedback and Analytics](#8-feedback-and-analytics)
9. [Backup and Recovery](#9-backup-and-recovery)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Introduction

### 1.1 What is CCMS?

The Calauan Citizen's Charter Management System (CCMS) is a web application designed to help the Municipality of Calauan, Laguna publish and manage citizen service charters. It provides a public portal where citizens can browse department services, view charter documents, and submit feedback, while administrators can manage departments, charters, documents, and analytics from a secure dashboard.

### 1.2 Key Capabilities

- **Public Charter Portal**: Citizens can browse departments, view service charters, preview documents, and submit feedback.
- **Department Management**: Create, edit, and organize departments and their associated charters.
- **Charter Management**: Full create, read, update, and delete operations for charter records.
- **Document Editing**: Built-in PDF annotation editor and DOCX viewer/editor for inline document modifications.
- **Feedback Collection**: Citizen feedback with star ratings, comments, and contact information.
- **Analytics Dashboard**: Feedback analytics with charts, filtering, CSV export, and Google Sheets integration.
- **Backup and Recovery**: Database backup download and restore capabilities.

### 1.3 System Requirements

- **Web Browser**: Modern browsers (Chrome, Firefox, Edge, Safari) - latest versions recommended.
- **Internet Connection**: Required for accessing the application.
- **Screen Resolution**: Minimum 1024x768 recommended; responsive design supports mobile devices.

---

## 2. Getting Started

### 2.1 Accessing the Application

**Public Portal (Citizens)**:
Navigate to the application URL in your web browser. The home page loads automatically.

**Admin Dashboard**:
Add `/admin` to the application URL (e.g., `https://your-domain.com/admin`). You will be redirected to the login page.

### 2.2 Admin Login

1. Navigate to the admin login page (`/admin/login`).
2. Enter your **Username** and **Password**.
3. Click the **eye icon** to toggle password visibility if needed.
4. Click **Sign in**.

**Default Credentials** (for initial setup):
- Username: `admin`
- Password: `admin123`

> **Important**: Change the default password after first login by updating the `ADMIN_PASSWORD` environment variable on the server.

### 2.3 Admin Navigation

After logging in, you will see the admin dashboard with a top navigation bar containing:

| Navigation Item | Description |
|---|---|
| **Dashboard** | Overview statistics and recent activity |
| **Departments** | Manage government departments |
| **Charters** | Manage service charters |
| **Edited Charters** | View and delete edited charter documents |
| **Feedback** | View feedback analytics and responses |
| **Backup** | Database backup and recovery tools |

### 2.4 Logging Out

Click your **username** in the top-right corner of the admin header, then click **Logout** from the dropdown menu.

### 2.5 Dark/Light Theme

Click the **sun/moon icon** in the admin header to toggle between light and dark themes. Your preference is saved automatically.

---

## 3. Citizen Portal (Public)

### 3.1 Home Page

The home page is the main landing page for citizens. It includes:

- **Header**: Municipality banner with official logos (ARTA, Calauan, Bagong Pilipinas), date/time display, and navigation.
- **Hero Section**: Welcome message with department search bar.
- **Department Grid**: Clickable cards for each department with search functionality.
- **Statistics Banner**: Displays the total number of departments and charters.
- **Logo Carousel**: Scrolling display of department logos.
- **How to Use**: Step-by-step guide for citizens.
- **Feedback and Complaints**: Information on how to submit feedback and file complaints.
- **Footer**: Contact information, map link, email, and social media.

**To find a department**:
Use the search bar above the department grid. Type the department name to filter results.

**To view a department's charters**:
Click on any department card to navigate to the department page.

### 3.2 Department Page

The department page lists all charters published by the selected department.

- **Search Bar**: Filter charters by title or content keyword.
- **Charter List**: Each charter displays its title and a brief description.
- **Click a Charter**: Navigate to the full charter detail page.

### 3.3 Charter Detail Page

The charter detail page provides complete information about a specific service charter.

**Charter Information**:
- Title and full content description.
- Associated department name.
- File attachment (if uploaded).

**Document Preview**:
- **PDF Files**: View directly in an embedded PDF viewer within the page.
- **DOCX Files**: Rendered as formatted HTML for in-browser reading.
- **Download**: Use the download button to save the original file.

**Citizen Feedback Form** (at the bottom of the page):

1. **Full Name** (required): Enter your complete name.
2. **Email** (optional): Enter your email address.
3. **Contact Number** (optional): Enter your phone number.
4. **Rating**: Click on the stars to rate from 1 to 5 (1 = poor, 5 = excellent).
5. **Comment** (optional): Type additional feedback or suggestions.
6. Click **Submit Feedback** to send your response.

**QR Code**:
A QR code is displayed on the charter page. Scanning it with a mobile device takes you directly to the feedback form for that charter.

### 3.4 Feedback and Complaints Section

The home page includes a dedicated section for feedback and complaints mechanisms:

**How to Send Feedback**:
- Answer the **Client Satisfaction Measurement Form** and drop it at the designated drop box in the Public Information Desk or in front of offices.
- Contact for inquiries: (0917) 154 4318 or Calauanlaguna.hrmo@gmail.com

**How Feedback is Processed**:
1. Every Friday, the Designated Officer opens the drop box, compiles, and records all feedback.
2. Feedback requiring answers are endorsed to the relevant offices (response within 3 days).
3. The answer of the office concerned is relayed to the citizen.
4. Comments/suggestions are sent to office concerns for proper action.

**How to File a Complaint**:
- Answer the **Client Complaint Form** and drop it at the designated drop box in front of the Public Information Desk.
- Complaints can also be filed via telephone and e-mail.
- Required information:
  - Name of person being complained
  - Incident
  - Evidence
  - Name and contact number of complainant
- Contact for complaints: (0917) 154 4318 or Calauanlaguna.hrmo@gmail.com

**How Complaints are Processed**:
1. The Designated Officer collates complaints daily and evaluates each.
2. Barangay concerns are forwarded to Barangay Captains for compliance.
3. Municipal employee complaints: HRMO calls for explanation within 24 hours.
4. If necessary, forwarded to Investigation Committee for further investigation.
5. Recommendation rendered to the Disciplining Authority for decision.

**Other Contact Information**:
- **LPAO** (Legal and Public Assistance Office): (02) 8478-5099
- **ARTA** (Anti-Red Tape Authority): (02) 8246-7940, complaints@arta.gov.ph
- **Presidential Complaints Center**: (02) 8736-8645 / 8736-8603, pcc@malacanang.gov.ph
- **Contact Center ng Bayan (CCB)**: (0908) 881-6565 / 1-6565

---

## 4. Admin Dashboard

### 4.1 Dashboard Overview

The dashboard provides a quick summary of the system:

- **Summary Cards**:
  - Total Departments
  - Total Charters
  - Total Attachments (charter files)
  - Total Feedback Responses
- **Recent Charters Table**: Shows the most recently created or updated charters with links to view details.
- **Quick Links**: Direct navigation to major admin sections (Departments, Charters, Feedback, Backup).

### 4.2 Dashboard Navigation Tips

- Click any summary card title to navigate to the corresponding management page.
- Click a charter title in the Recent Charters table to open it in the Charters management page.
- Use the Quick Links section for fast access to frequently used features.

---

## 5. Department Management

Navigate to **Departments** from the admin navigation bar.

### 5.1 Viewing Departments

The departments page displays a table of all departments with:
- Department name
- Description
- Number of associated charters
- Action buttons (Edit, Delete)

**Search**: Use the search bar to filter departments by name or description.

**Pagination**: Navigate between pages using the pagination controls at the bottom.

### 5.2 Creating a Department

1. Click the **Add Department** button.
2. Fill in the form:
   - **Name** (required): Enter the department name.
   - **Description** (optional): Enter a brief description of the department.
3. Click **Save** to create the department.

### 5.3 Editing a Department

1. Click the **Edit** button (pencil icon) next to the department you want to modify.
2. Update the name and/or description in the modal form.
3. Click **Save** to apply changes.

### 5.4 Deleting a Department

1. Click the **Delete** button (trash icon) next to the department.
2. A confirmation dialog appears. If the department has associated charters, a warning is displayed.
3. Click **Confirm** to permanently delete the department, or **Cancel** to abort.

> **Warning**: Deleting a department with associated charters will also delete all those charters (cascade delete).

---

## 6. Charter Management

Navigate to **Charters** from the admin navigation bar.

### 6.1 Viewing Charters

The charters page displays a table of all charters with:
- Charter title
- Department name
- Content preview
- Attachment status
- Last edited info (editor name and date)
- Action buttons

**Search**: Filter charters by title or content keyword.
**Department Filter**: Filter charters by selecting a specific department from the dropdown.
**Pagination**: Navigate between pages using the pagination controls.

### 6.2 Creating a Charter

1. Click the **Add Charter** button.
2. Fill in the form:
   - **Department** (required): Select the department from the dropdown.
   - **Title** (required): Enter the charter title (minimum 5 characters).
   - **Content** (required): Enter the charter description or service details (minimum 20 characters).
   - **File Attachment** (optional): Upload a PDF or DOCX file (max 5MB).
3. Click **Save** to create the charter.

### 6.3 Editing a Charter

1. Click the **Edit** button (pencil icon) next to the charter.
2. Modify the department, title, content, or attachment in the modal form.
3. Click **Save** to apply changes.

### 6.4 Deleting a Charter

1. Click the **Delete** button (trash icon) next to the charter.
2. A confirmation dialog appears.
3. Click **Confirm** to permanently delete the charter, or **Cancel** to abort.

> **Warning**: Deleting a charter also deletes its edit history and associated feedback.

### 6.5 Viewing and Editing Charter Documents

Click the **View** button (eye icon) or the **file attachment name** to open the document viewer/editor.

**Before editing**: The system prompts you to enter your **editor name**. This name is recorded in the edit history for accountability.

**Supported File Types**:
- **PDF**: Opens in the PDF Annotation Editor.
- **DOCX**: Opens in the DOCX Viewer/Editor.

See [Section 7: Document Editors](#7-document-editors) for detailed editing instructions.

### 6.6 Edit History

Each charter maintains a complete edit history. To view it:
1. Open the charter in the viewer/editor.
2. The edit history panel shows all previously saved versions.
3. Each entry displays the editor name, date, and file metadata.

### 6.7 Edited Charters Page

Navigate to **Edited Charters** from the admin navigation bar to view all edited charter documents across all departments.

**Features**:
- **Search**: Filter by charter name or department.
- **Pagination**: Shows 50 items at a time. Click **Show More** to load additional items.
- **Delete Button**: Remove edited charter versions with confirmation popup.

**To delete an edited charter**:
1. Click the **trash icon** next to the edited charter you want to remove.
2. A confirmation modal appears showing the charter title and filename.
3. Click **Delete** to confirm, or **Cancel** to abort.

> **Note**: Deleting an edited charter removes both the file and the database record. The original charter file is not affected.

---

## 7. Document Editors

### 7.1 PDF Annotation Editor

The PDF editor allows you to annotate existing PDF documents with text, drawings, and highlights.

**Opening the Editor**:
Click a charter's PDF attachment to open the PDF Annotation Editor.

**Toolbar Tools**:

| Tool | Icon | Description |
|---|---|---|
| **Text** | T | Click anywhere on the PDF to add a text annotation. Configure color and font size before placing. |
| **Draw** | Pencil | Draw freehand on the PDF. Configure stroke color and width. |
| **Highlight** | Highlighter | Click and drag to create rectangular highlight regions. |
| **Select** | Cursor | Click on existing text annotations to edit or reposition them. |

**Navigation and View**:

- **Page Navigation**: Use the arrows or page number input to navigate between pages.
- **Zoom**: Use the zoom buttons or slider to adjust the view (50%-400%).
- **Clear Annotations**: Click the trash icon to remove all annotations from the current page.

**Saving**:

- Click **Export PDF** to download the annotated PDF with all annotations embedded.
- Annotations are permanently saved in the exported file.

**Keyboard Shortcuts**:

- `Ctrl + Z`: Undo last annotation.
- `Ctrl + Y`: Redo last undone annotation.

### 7.2 DOCX Viewer/Editor

The DOCX editor allows you to view and edit Word documents directly in the browser.

**Opening the Editor**:
Click a charter's DOCX attachment to open the DOCX Viewer/Editor.

**Viewing Mode**:
- The document is rendered as formatted HTML using mammoth.js.
- Use **zoom controls** (50%-200%) to adjust the view.

**Editing Mode**:

1. Click anywhere in the document to start editing (the content becomes editable).
2. Make your changes directly in the document.
3. The **Save** button activates when changes are detected (shown as "Unsaved changes" indicator).
4. Click **Save** or press `Ctrl + S` to save your changes.

**Toolbar**:

| Button | Shortcut | Description |
|---|---|---|
| **Save** | `Ctrl + S` | Save edited content as a new DOCX file on the server |
| **Undo** | `Ctrl + Z` | Undo the last edit |
| **Redo** | `Ctrl + Y` | Redo the last undone edit |
| **Reset** | - | Revert to the original document content |
| **Zoom In** | - | Increase zoom level |
| **Zoom Out** | - | Decrease zoom level |
| **Print** | - | Print the document (admin only) |

**Saving Process**:

1. Click **Save** or press `Ctrl + S`.
2. The system converts your edits back to a DOCX file.
3. The file is saved on the server and the charter's attachment is updated.
4. A success indicator appears when the save completes.

**Editor Identification**:
Before editing, you must enter your name. This name is recorded with the saved version for accountability tracking.

---

## 8. Feedback and Analytics

Navigate to **Feedback** from the admin navigation bar.

### 8.1 Viewing Feedback

The feedback page displays all citizen feedback responses in a table with:
- Citizen name
- Associated charter and department
- Star rating
- Comment text
- Submission date

**Search**: Filter feedback by citizen name, comment content, or charter title.

**Filters**:
- **Department**: Select a specific department to view its feedback.
- **Charter**: Select a specific charter to view its feedback.
- **Rating**: Filter by star rating (1-5).

### 8.2 Charts and Analytics

The feedback page includes several analytical visualizations:

**Rating Breakdown**:
- Bar chart showing the distribution of ratings (1-5 stars).
- Displays the count and percentage for each rating level.

**Source Breakdown**:
- Pie-style chart comparing feedback from different sources:
  - Legacy ratings (from the ratings table)
  - QR/form feedback (from the feedback form)

**Google Sheets Integration**:
If connected to a Google Form via Google Sheets, additional analytics are available:
- Per-question breakdown visualizations.
- Gender distribution pie chart.
- Age group distribution bar chart.
- Client type distribution pie chart.

### 8.3 CSV Export

To export feedback data:

1. Apply any desired filters (department, charter, rating).
2. Click the **Export CSV** button.
3. A CSV file downloads to your computer with all filtered feedback data.
4. Open the file in Excel, Google Sheets, or any spreadsheet application.

### 8.4 Feedback Form QR Code

To generate a QR code for the citizen feedback form:

1. Click the **QR Code** button on the feedback page.
2. A modal appears displaying:
   - A QR code image that citizens can scan with their phones.
   - A **Copy Link** button to copy the feedback form URL to your clipboard.
3. Share the QR code or link with citizens to encourage feedback submission.

---

## 9. Backup and Recovery

Navigate to **Backup** from the admin navigation bar.

### 9.1 Creating a Backup

To download a complete database backup:

1. Click the **Download Backup** button.
2. A `.sql` file downloads to your computer.
3. This file contains the complete database schema and all data.
4. Store the backup file in a safe location outside the project folder.

**Best Practices**:
- Create backups regularly (daily or weekly).
- Use timestamped filenames: `backup_ccms_db_20250101.sql`.
- Store backups in multiple locations (external drive, cloud storage).

### 9.2 Restoring from Backup

To restore the database from a backup file:

1. Click the **Restore** area or drag a `.sql` file onto the upload zone.
2. Select the `.sql` backup file from your computer.
3. A confirmation dialog appears warning that the current database will be overwritten.
4. Click **Confirm Restore** to proceed, or **Cancel** to abort.

> **Warning**: Restoring from a backup permanently overwrites all current data. Create a backup of the current state first if needed.

### 9.3 Importing Database Schema

To import the default database schema (useful for fresh installations or resetting the database):

1. Click the **Import Schema** button.
2. The system imports the schema from `database/ccms_db.sql`.
3. This creates all required tables and seed data.

### 9.4 Manual Backup Commands (Advanced)

For advanced users with command-line access:

**Create a backup**:
```bash
mysqldump -u root -p ccms_db > backup_ccms_db.sql
```

**Restore from backup**:
```bash
mysql -u root -p ccms_db < backup_ccms_db.sql
```

### 9.5 Edited Charters Retention

Edited charter documents are retained indefinitely. They will not be automatically deleted. To remove old edited versions:

1. Navigate to **Edited Charters** from the admin navigation bar.
2. Use the search bar to find the charter you want to remove.
3. Click the **trash icon** next to the edited version.
4. Confirm the deletion in the popup modal.

---

## 10. Troubleshooting

### Common Issues and Solutions

| Issue | Possible Cause | Solution |
|---|---|---|
| **Cannot log in** | Wrong credentials | Verify username and password. Default: `admin` / `admin123`. |
| **Page shows "Loading" forever** | Backend server is down | Check if the backend server is running. Visit `/api/health` to verify. |
| **No departments or charters shown** | Database not connected | Verify MySQL is running and database credentials are correct. |
| **File upload fails** | File too large or wrong type | Maximum file size is 5MB. Only PDF and DOCX files are accepted. |
| **CORS error in console** | Backend not configured for your domain | Update `CORS_ORIGIN` in `backend/.env` to include your frontend URL. |
| **Save edit fails** | Server not restarted after changes | Restart the backend server (`Ctrl+C` then `node server.js`). |
| **Document preview blank** | File not found on server | Verify the file exists in `frontend/uploads/charters/`. |
| **Feedback not submitting** | Required fields missing | Ensure your name and rating are provided. |
| **Charts not showing** | No feedback data or Google Sheets not configured | Submit feedback first. For Google Sheets charts, configure the API key. |
| **500 Internal Server Error** | Server-side error | Check the server console for error messages. Restart the server. |
| **401 Unauthorized on login** | Invalid credentials | Double-check your username and password. |
| **Dark theme not persisting** | Browser storage cleared | The theme preference is saved in localStorage. Re-toggle if lost. |

### Getting Help

If you encounter issues not covered in this manual:

1. Check the browser console for error messages (press `F12` then go to the Console tab).
2. Verify the backend server is running and accessible.
3. Check the server terminal output for error messages.
4. Ensure all environment variables are correctly configured.

---

## Appendix A: Keyboard Shortcuts

### DOCX Editor

| Shortcut | Action |
|---|---|
| `Ctrl + S` | Save document |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |

### PDF Editor

| Shortcut | Action |
|---|---|
| `Ctrl + Z` | Undo last annotation |
| `Ctrl + Y` | Redo last annotation |

---

## Appendix B: File Type Support

| File Type | Viewing | Editing | Max Size |
|---|---|---|---|
| PDF | Yes (embedded viewer) | Yes (annotation editor) | 5MB |
| DOCX | Yes (HTML rendering) | Yes (inline editor) | 5MB |
| SQL | N/A | N/A (backup files) | Unlimited |

---

## Appendix C: Environment Variables Reference

### Frontend Variables

| Variable | Purpose | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:4000/api` |
| `VITE_GSHEETS_API_KEY` | Google Sheets API key for analytics | `AIzaSy...` |
| `VITE_GSHEETS_SPREADSHEET_ID` | Google Sheets spreadsheet ID | `1Op53bBwh...` |
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

### Backend Variables

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | Server listening port (auto-increments if in use) | `4000` |
| `CORS_ORIGIN` | Allowed frontend origins | `http://localhost:5173,https://your-domain.com` |
| `ALLOW_ALL_ORIGINS` | Allow all CORS origins | `false` |
| `DB_HOST` | MySQL server host | `127.0.0.1` |
| `DB_PORT` | MySQL server port | `3306` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `your_password` |
| `DB_NAME` | Database name | `ccms_db` |
| `DB_SSL` | Enable SSL for MySQL | `false` |
| `DB_POOL_SIZE` | Connection pool size | `10` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `admin123` |
| `MYSQL_BIN` | Path to mysql CLI binary for restore | `mysql` |
| `EDITED_CHARTERS_RETENTION_DAYS` | Days to retain edited charters (currently unused) | `30` |

---

## Appendix D: Database Tables Reference

| Table | Key Columns | Purpose |
|---|---|---|
| `admins` | `username`, `password_hash` | Admin user accounts |
| `departments` | `name`, `description` | Government departments |
| `charters` | `title`, `content`, `file_path`, `department_id` | Service charter records |
| `ratings` | `charter_id`, `rating` (1-5), `comment` | Legacy citizen ratings |
| `feedback_responses` | `charter_id`, `name`, `email`, `contact`, `rating`, `comment` | Primary citizen feedback |
| `charter_pdf_edits` | `charter_id`, `file_path`, `submitted_name`, `notes` | Document edit history |

---

## Appendix E: Local Development Setup

For developers setting up the project locally:

### Prerequisites

- Node.js 18+
- npm
- MySQL 8.0+ (via WAMP or XAMPP) running on port 3306

### Quick Start

1. **Start WAMP/XAMPP** to ensure MySQL is running on port 3306.

2. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd Citizen-s-Charter-Management-System
   ```

3. **Install all dependencies**:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Import the database schema**:
   ```bash
   mysql -u root -p < backend/database/ccms_db.sql
   ```

5. **Configure environment variables**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your MySQL credentials
   ```

6. **Start both servers**:
   ```bash
   npm run dev:all
   ```

   | Service | URL |
   |---|---|
   | Frontend | `http://localhost:5173` |
   | Backend API | `http://localhost:4000` |
   | MySQL (WAMP) | `127.0.0.1:3306` |

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev:all` | Start both backend and frontend concurrently |
| `npm run dev:backend` | Start only the backend server |
| `npm run dev:frontend` | Start only the frontend dev server |

### Running Tests

**Backend tests** (Supertest integration tests):
```bash
cd backend && npm test
```

**Frontend tests** (Vitest + React Testing Library):
```bash
cd frontend && npm test
```

**Watch mode** (auto-rerun on file changes):
```bash
cd backend && npm run test:watch
cd frontend && npm run test:watch
```

---

*This user manual is for the Calauan Citizen's Charter Management System. For technical setup and deployment instructions, refer to the README.md file.*
