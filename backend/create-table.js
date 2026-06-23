import { pool } from "./db.js";

await pool.query(`
  CREATE TABLE IF NOT EXISTS charter_pdf_edits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    charter_id INT UNSIGNED NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    size_bytes INT,
    submitted_name VARCHAR(255),
    submitted_email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (charter_id) REFERENCES charters(id) ON DELETE CASCADE
