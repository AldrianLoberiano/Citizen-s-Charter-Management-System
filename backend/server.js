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
app.disable("etag");
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
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/octet-stream",
    ];
    const lower = file.originalname.toLowerCase();
    const allowedExts = [".pdf", ".docx", ".doc"];
    const hasValidExt = allowedExts.some((ext) => lower.endsWith(ext));
    const hasValidMime = allowedMimes.includes(file.mimetype);
    if (!hasValidExt && !hasValidMime) {
      callback(new Error("Only PDF and Word document files are allowed."));
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
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowed.includes(file.mimetype)) {
      callback(new Error("Only PDF and Word document files are allowed."));
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
      const error = new Error("Only .sql files are allowed.");
      error.statusCode = 400;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

const uploadSqlBackup = (req, res) =>
  new Promise((resolve, reject) => {
    sqlUpload.single("file")(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
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
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    etag: false,
    lastModified: false,
    cacheControl: false,
    maxAge: 0,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    },
  })
);

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
            if (v instanceof Date) return "'" + v.toISOString().slice(0,19).replace("T"," ") + "'";
            if (typeof v === "string" && /^\w{3} \w{3} \d{2} \d{4}/.test(v)) {
              const d = new Date(v);
              if (!isNaN(d.getTime())) return "'" + d.toISOString().slice(0,19).replace("T"," ") + "'";
            }
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

const restoreFromSql = async (sql) => {
  if (!sql || !sql.trim()) {
    const err = new Error("Uploaded SQL is empty");
    err.statusCode = 400;
    throw err;
  }

  const splitStatements = (sourceSql) => {
    const statements = [];
    const lines = sourceSql.replace(/^\uFEFF/, "").split(/\r?\n/);

    let delimiter = ";";
    let buffer = "";

    const pushBuffer = () => {
      const stmt = buffer.trim();
      if (stmt) statements.push(stmt);
      buffer = "";
    };

    for (const line of lines) {
      const trimmed = line.trim();

      if (!buffer && (!trimmed || trimmed.startsWith("--") || trimmed.startsWith("#"))) {
        continue;
      }

      const delimiterMatch = trimmed.match(/^DELIMITER\s+(.+)$/i);
      if (delimiterMatch) {
        pushBuffer();
        delimiter = delimiterMatch[1].trim();
        continue;
      }

      buffer += line + "\n";

      if (delimiter && buffer.trimEnd().endsWith(delimiter)) {
        pushBuffer();
      }
    }

    pushBuffer();
    return statements;
  };

  // 1) Primary approach: execute the full script at once (multipleStatements enabled in pool)
  try {
    await pool.query(sql);
    return { restoredMode: "bulk", restoredStatements: "unknown" };
  } catch (bulkError) {
    // 2) Fallback: delimiter-aware splitting to avoid breaking procedures/triggers/etc.
    const fallbackError = bulkError;

    const statements = splitStatements(sql);

    // Execute sequentially
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const normalizedStmt = stmt.trim();
      if (
        !normalizedStmt ||
        normalizedStmt.startsWith("DELIMITER ") ||
        normalizedStmt.startsWith("--") ||
        normalizedStmt.startsWith("#") ||
        /^\/\*(?!\!)/.test(normalizedStmt)
      ) {
        continue;
      }
      try {
        await pool.query(stmt);
      } catch (error) {
        const preview = stmt.slice(0, 800);
        const err = new Error(
          `SQL restore failed at statement ${i + 1}/${statements.length}: ${error?.message || String(error)}`
        );
        err.original = {
          code: error?.code,
          errno: error?.errno,
          sqlState: error?.sqlState,
          sqlMessage: error?.sqlMessage,
        };
        err.sqlPreview = preview;
        err.statementIndex = i + 1;
        err.statementCount = statements.length;
        err.bulkOriginal = {
          code: fallbackError?.code,
          errno: fallbackError?.errno,
          sqlState: fallbackError?.sqlState,
          sqlMessage: fallbackError?.sqlMessage,
          message: fallbackError?.message,
        };
        throw err;
      }
    }

    // If fallback succeeded, return
    return { restoredMode: "fallback", restoredStatements: statements.length };
  }
};

app.post("/api/admin/restore", async (req, res) => {
  try {
    await uploadSqlBackup(req, res);

    if (!req.file) {
      return res.status(400).json({ message: "No SQL file uploaded" });
    }

    const { host, port, user, password, database } = {
      host: process.env.DB_HOST || "127.0.0.1",
      port: process.env.DB_PORT || "3306",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "ccms_db",
    };

    const mysqlBin = process.env.MYSQL_BIN || "C:\\\\laragon\\\\bin\\\\mysql\\\\mysql-8.0.30-winx64\\\\bin\\\\mysql.exe";

    const result = await new Promise((resolve, reject) => {
      const args = ["--host", host, "--port", String(port), "--user", user];
      if (password) args.push(`-p${password}`);
      args.push(database);

      const child = spawn(mysqlBin, args, { stdio: ["pipe", "ignore", "pipe"] });

      const fileStream = fs.createReadStream(req.file.path);
      fileStream.pipe(child.stdin);

      let stderr = "";
      child.stderr.on("data", (d) => { stderr += d.toString(); });
      child.on("close", (code) => {
        if (code === 0) {
          resolve({ ok: true, restoredMode: "cli" });
        } else {
          reject(new Error(stderr || `mysql exited with code ${code}`));
        }
      });
      child.on("error", (err) => {
        reject(new Error("Failed to run mysql: " + err.message));
      });
    });

    return res.json(result);
  } catch (error) {
    console.error("Restore error:", error?.message || error);
    const statusCode = error?.statusCode || (error?.name === "MulterError" ? 400 : 500);
    return res.status(statusCode).json({
      message: error?.message || "Failed to restore database from SQL",
    });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

app.post("/api/admin/restore-sql", async (req, res) => {
  try {
    const { sql } = req.body || {};
    const result = await restoreFromSql(sql);
    return res.json({ ok: true, ...result });
  } catch (error) {
    console.error("Restore-sql error:", error);
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json({
      message: "Failed to restore database from SQL",
      error: error?.message || String(error),
      code: error?.code || undefined,
      errno: error?.errno || undefined,
      sqlState: error?.sqlState || undefined,
    });
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
    const matchesFallbackCredentials = username === adminUsername && password === adminPassword;

    if (admin) {
      const normalizedHash = admin.password_hash.replace(/^\$2y\$/, "$2b$");
      const ok = await bcrypt.compare(password, normalizedHash);
      if (!ok && !matchesFallbackCredentials) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
    } else if (!matchesFallbackCredentials) {
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

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
app.listen(port, () => {
  console.log(`CCMS backend listening on http://localhost:${port}`);
});