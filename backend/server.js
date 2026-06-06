import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { spawn } from "child_process";
import multer from "multer";
import { pool } from "./db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

const uploadsDir = path.join(__dirname, "../uploads/charters");
fs.mkdirSync(uploadsDir, { recursive: true });
const editedDir = path.join(__dirname, "../uploads/edited-charters");
fs.mkdirSync(editedDir, { recursive: true });
const backupsDir = path.join(__dirname, "../uploads/backups");
fs.mkdirSync(backupsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const safeBase = `${Date.now()}-${file.originalname}`.replace(/[^a-zA-Z0-9._-]/g, "_");
    callback(null, safeBase);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      callback(new Error("Only PDF files are allowed."));
      return;
    }
    callback(null, true);
  },
});

const editedStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, editedDir);
  },
  filename: (_req, file, callback) => {
    const safeBase = `${Date.now()}-${file.originalname}`.replace(/[^a-zA-Z0-9._-]/g, "_");
    callback(null, safeBase);
  },
});

const editedUpload = multer({
  storage: editedStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      callback(new Error("Only PDF files are allowed."));
      return;
    }
    callback(null, true);
  },
});

const sqlStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, backupsDir);
  },
  filename: (_req, file, callback) => {
    const safeBase = `${Date.now()}-${file.originalname}`.replace(/[^a-zA-Z0-9._-]/g, "_");
    callback(null, safeBase);
  },
});

const sqlUpload = multer({
  storage: sqlStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["application/sql", "text/plain", "application/octet-stream"];
    const isSql = file.originalname.toLowerCase().endsWith(".sql");
    if (!isSql && !allowed.includes(file.mimetype)) {
      callback(new Error("Only .sql files are allowed."));
      return;
    }
    callback(null, true);
  },
});

const getDbArgs = () => {
  const dbHost = process.env.DB_HOST || "127.0.0.1";
  const dbPort = process.env.DB_PORT || "3306";
  const dbUser = process.env.DB_USER || "root";
  const dbPassword = process.env.DB_PASSWORD || "";
  const dbName = process.env.DB_NAME || "ccms_db";

  // Used for mysql/mysqldump commands (credentials passed via CLI flags)
  // Note: this mirrors existing behavior where secrets come from env vars.
  const baseArgs = ["--host", dbHost, "--port", String(dbPort), "--user", dbUser];
  if (dbPassword) {
    baseArgs.push(`--password=${dbPassword}`);
  }
  return { baseArgs, dbName, dbUser, dbPassword };
};

const isLocalhostOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
const allowAllOrigins =
  String(process.env.ALLOW_ALL_ORIGINS || "").toLowerCase() === "true" ||
  process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowAllOrigins) {
        callback(null, true);
        return;
      }
      if (!origin || allowedOrigins.includes(origin) || isLocalhostOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.post("/api/uploads/charters", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.status(201).json({
    file_path: `/uploads/charters/${req.file.filename}`,
    original_name: req.file.originalname,
    mime_type: req.file.mimetype,
    size: req.file.size,
  });
});

app.post("/api/charters/:id/edited-pdfs", editedUpload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const charterId = Number(req.params.id);
  if (!charterId || Number.isNaN(charterId)) {
    return res.status(400).json({ message: "Invalid charter id" });
  }

  const { submitted_name = "", submitted_email = "", notes = "" } = req.body || {};

  const [charterRows] = await pool.query("SELECT id FROM charters WHERE id = ?", [charterId]);
  if (!charterRows || charterRows.length === 0) {
    return res.status(404).json({ message: "Charter not found" });
  }

  const insertSql = `INSERT INTO charter_pdf_edits
      (charter_id, file_path, original_name, mime_type, size_bytes, submitted_name, submitted_email, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  const [insertResult] = await pool.query(insertSql, [
    charterId,
    `/uploads/edited-charters/${req.file.filename}`,
    req.file.originalname,
    req.file.mimetype,
    req.file.size,
    submitted_name.trim() || null,
    submitted_email.trim() || null,
    notes.trim() || null,
  ]);

  const newId = insertResult?.insertId;
  const [rows] = await pool.query("SELECT * FROM charter_pdf_edits WHERE id = ?", [newId]);
  return res.status(201).json(rows[0]);
});


app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/admin/backup", async (_req, res) => {
  try {
    const filename = `backup_${new Date().toISOString().slice(0, 10)}.sql`;

    res.setHeader("Content-Type", "application/sql; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const [tablesRows] = await pool.query("SHOW TABLES");
    const tableKey = Object.keys(tablesRows?.[0] || {})[0];

    const tables = (tablesRows || []).map((r) => r[tableKey]).filter(Boolean);

    // Header
    res.write(`-- CCMS MySQL backup (${new Date().toISOString()})\n`);
    res.write(`-- Database: ${process.env.DB_NAME || "ccms_db"}\n\n`);
    res.write(`SET FOREIGN_KEY_CHECKS = 0;\n\n`);

    // Schema
    for (const table of tables) {
      const [createRows] = await pool.query(`SHOW CREATE TABLE \`${table}\``);
      const createStmt = createRows?.[0]?.["Create Table"] || createRows?.[0]?.[Object.keys(createRows?.[0] || {})[1]];
      res.write(`DROP TABLE IF EXISTS \`${table}\`;\n`);
      res.write(`${createStmt};\n\n`);
    }

    // Data
    res.write(`SET FOREIGN_KEY_CHECKS = 1;\n\n`);
    for (const table of tables) {
      const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
      if (!rows || rows.length === 0) continue;

      const columns = Object.keys(rows[0] || {});
      const colList = columns.map((c) => `\`${c}\``).join(", ");

      for (const row of rows) {
        const valuesSql = columns
          .map((c) => {
            const v = row[c];
            if (v === null || v === undefined) return "NULL";
            if (typeof v === "number") return String(v);
            if (typeof v === "bigint") return `${v.toString()} `;
            // Escape strings for SQL
            return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
          })
          .join(", ");

        res.write(`INSERT INTO \`${table}\` (${colList}) VALUES (${valuesSql});\n`);
      }

      res.write("\n");
    }

    res.end();
  } catch (error) {
    console.error("Backup error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to generate backup SQL",
        error: error?.message || String(error),
      });
    } else {
      res.end();
    }
  }
});

app.post("/api/admin/import-schema", async (_req, res) => {
  try {
    const sqlPath = path.join(__dirname, "../database/ccms_mysql.sql");
    if (!fs.existsSync(sqlPath)) {
      return res.status(400).json({ message: "SQL schema file not found", sqlPath });
    }

    const sql = fs.readFileSync(sqlPath, "utf8");
    if (!sql.trim()) {
      return res.status(400).json({ message: "SQL schema file is empty", sqlPath });
    }

    await pool.query(sql);
    return res.json({ ok: true, imported: "ccms_mysql.sql" });
  } catch (error) {
    console.error("Schema import error:", error);
    return res.status(500).json({ message: "Failed to import schema", error: error?.message || String(error) });
  }
});

app.post("/api/admin/restore", sqlUpload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No SQL file uploaded" });
  }

  try {
    const sql = fs.readFileSync(req.file.path, "utf8");
    if (!sql.trim()) {
      return res.status(400).json({ message: "Uploaded SQL file is empty" });
    }

    await pool.query(sql);

    return res.json({ ok: true });
  } catch (error) {
    console.error("Restore error:", error);
    return res.status(500).json({
      message: "Failed to restore database from SQL",
      error: error?.message || String(error),
    });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

app.get("/api/departments", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM departments ORDER BY id ASC");
  res.json(rows);
});

app.get("/api/departments/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM departments WHERE id = ?", [req.params.id]);
  const department = rows[0];
  if (!department) return res.status(404).json({ message: "Department not found" });
  res.json(department);
});

app.post("/api/departments", async (req, res) => {
  const { name, description = "" } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ message: "Department name is required" });

  const [insertResult] = await pool.query(
    "INSERT INTO departments (name, description) VALUES (?, ?)",
    [name.trim(), description.trim()]
  );
  const newId = insertResult?.insertId;

  const [rows] = await pool.query("SELECT * FROM departments WHERE id = ?", [newId]);
  res.status(201).json(rows[0]);
});

app.put("/api/departments/:id", async (req, res) => {
  const { name, description = "" } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ message: "Department name is required" });

  const [updateResult] = await pool.query(
    "UPDATE departments SET name = ?, description = ? WHERE id = ?",
    [name.trim(), description.trim(), req.params.id]
  );

  if ((updateResult?.affectedRows || 0) === 0) {
    return res.status(404).json({ message: "Department not found" });
  }

  const [rows] = await pool.query("SELECT * FROM departments WHERE id = ?", [req.params.id]);
  res.json(rows[0]);
});

app.delete("/api/departments/:id", async (req, res) => {
  const [deleteResult] = await pool.query("DELETE FROM departments WHERE id = ?", [req.params.id]);
  if ((deleteResult?.affectedRows || 0) === 0) return res.status(404).json({ message: "Department not found" });
  res.status(204).send();
});

app.get("/api/charters", async (req, res) => {
  const { departmentId } = req.query;
  const conditions = [];
  const params = [];
  if (departmentId) {
    params.push(departmentId);
    conditions.push(`department_id = ?`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT * FROM charters ${where} ORDER BY id ASC`;
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

app.get("/api/charters/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM charters WHERE id = ?", [req.params.id]);
  const charter = rows[0];
  if (!charter) return res.status(404).json({ message: "Charter not found" });
  res.json(charter);
});

app.post("/api/charters", async (req, res) => {
  const { department_id, title, content, file_path = null } = req.body || {};
  if (!department_id || !title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: "department_id, title, and content are required" });
  }

  const [insertResult] = await pool.query(
    "INSERT INTO charters (department_id, title, content, file_path) VALUES (?, ?, ?, ?)",
    [department_id, title.trim(), content.trim(), file_path]
  );
  const newId = insertResult?.insertId;

  const [rows] = await pool.query("SELECT * FROM charters WHERE id = ?", [newId]);
  res.status(201).json(rows[0]);
});

app.put("/api/charters/:id", async (req, res) => {
  const { department_id, title, content, file_path = null } = req.body || {};
  if (!department_id || !title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: "department_id, title, and content are required" });
  }

  const [updateResult] = await pool.query(
    "UPDATE charters SET department_id = ?, title = ?, content = ?, file_path = ? WHERE id = ?",
    [department_id, title.trim(), content.trim(), file_path, req.params.id]
  );

  if ((updateResult?.affectedRows || 0) === 0) {
    return res.status(404).json({ message: "Charter not found" });
  }

  const [rows] = await pool.query("SELECT * FROM charters WHERE id = ?", [req.params.id]);
  res.json(rows[0]);
});

app.delete("/api/charters/:id", async (req, res) => {
  const [deleteResult] = await pool.query("DELETE FROM charters WHERE id = ?", [req.params.id]);
  if ((deleteResult?.affectedRows || 0) === 0) return res.status(404).json({ message: "Charter not found" });
  res.status(204).send();
});

app.get("/api/ratings", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM ratings ORDER BY created_at DESC, id DESC");
  res.json(rows);
});

app.get("/api/charters/:id/ratings", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM ratings WHERE charter_id = ? ORDER BY id ASC", [req.params.id]);
  res.json(rows);
});

app.post("/api/charters/:id/ratings", async (req, res) => {
  const { rating, comment = "" } = req.body || {};
  const parsedRating = Number(rating);
  if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const [insertResult] = await pool.query(
    "INSERT INTO ratings (charter_id, rating, comment) VALUES (?, ?, ?)",
    [req.params.id, parsedRating, comment.trim()]
  );
  const newId = insertResult?.insertId;

  const [rows] = await pool.query("SELECT * FROM ratings WHERE id = ?", [newId]);
  res.status(201).json(rows[0]);
});

app.get("/api/feedback", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM feedback_responses ORDER BY created_at DESC, id DESC"
  );
  res.json(rows);
});

app.get("/api/charters/:id/feedback", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM feedback_responses WHERE charter_id = ? ORDER BY created_at DESC, id DESC",
    [req.params.id]
  );
  res.json(rows);
});

app.post("/api/charters/:id/feedback", async (req, res) => {
  const {
    name = "",
    email = "",
    contact = "",
    rating,
    comment = "",
  } = req.body || {};
  const parsedRating = Number(rating);
  if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const [insertResult] = await pool.query(
    "INSERT INTO feedback_responses (charter_id, name, email, contact, rating, comment) VALUES (?, ?, ?, ?, ?, ?)",
    [
      req.params.id,
      String(name).trim() || null,
      String(email).trim() || null,
      String(contact).trim() || null,
      parsedRating,
      String(comment).trim() || null,
    ]
  );

  const newId = insertResult?.insertId;
  const [rows] = await pool.query("SELECT * FROM feedback_responses WHERE id = ?", [newId]);
  res.status(201).json(rows[0]);
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM admins WHERE username = ?", [username]);
    const admin = rows[0];

    if (admin) {
      const normalizedHash = admin.password_hash.replace(/^\$2y\$/, "$2b$");
      const ok = await bcrypt.compare(password, normalizedHash);
      if (!ok) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
    } else if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = await bcrypt.hash(`${username}:${Date.now()}`, 8);
    res.json({
      token,
      user: { username },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
});

app.listen(port, () => {
  console.log(`CCMS backend listening on http://localhost:${port}`);
});
