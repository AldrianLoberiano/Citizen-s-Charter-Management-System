import { pool } from "./db.js";

await pool.query(`
  CREATE TABLE IF NOT EXISTS charter_pdf_edits (
