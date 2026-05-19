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
  const dbPort = process.env.DB_PORT || "5432";
  const dbUser = process.env.DB_USER || "postgres";
  const dbPassword = process.env.DB_PASSWORD || "";
  const dbName = process.env.DB_NAME || "ccms_db";

  const baseArgs = ["--host", dbHost, "--port", String(dbPort), "--username", dbUser];
  const env = { ...process.env };
  if (dbPassword) {
    env.PGPASSWORD = dbPassword;
  }
  return { baseArgs, dbName, env };
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
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


app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/admin/backup", (_req, res) => {
  const { baseArgs, dbName, env } = getDbArgs();
  const filename = `backup_${new Date().toISOString().slice(0, 10)}.sql`;

  res.setHeader("Content-Type", "application/sql");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const child = spawn("pg_dump", [...baseArgs, "--no-owner", "--no-privileges", dbName], {
    windowsHide: true,
    env,
  });

  child.stdout.pipe(res);

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  child.on("error", (error) => {
    res.status(500).send(error.message || "Failed to start pg_dump.");
  });

  child.on("close", (code) => {
    if (code === 0) return;
    if (!res.headersSent) {
      res.status(500).send(stderr || `pg_dump exited with code ${code}`);
    }
  });
});

app.post("/api/admin/restore", sqlUpload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No SQL file uploaded" });
  }

  const { baseArgs, dbName, env } = getDbArgs();
  const psqlArgs = [...baseArgs, "--dbname", dbName];
  const child = spawn("psql", psqlArgs, { windowsHide: true, env });
  const input = fs.createReadStream(req.file.path);
  let stderr = "";

  input.on("error", (error) => {
    res.status(500).json({ message: error.message || "Failed to read SQL file." });
  });

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  child.on("error", (error) => {
    res.status(500).json({ message: error.message || "Failed to start psql." });
  });

  child.on("close", (code) => {
    fs.unlink(req.file.path, () => {});
    if (code === 0) {
      return res.json({ ok: true });
    }
    return res.status(500).json({ message: stderr || `psql exited with code ${code}` });
  });

  input.pipe(child.stdin);
});

app.get("/api/departments", async (_req, res) => {
  const result = await pool.query("SELECT * FROM departments ORDER BY id ASC");
  res.json(result.rows);
});

app.get("/api/departments/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM departments WHERE id = $1", [req.params.id]);
  const department = result.rows[0];
  if (!department) return res.status(404).json({ message: "Department not found" });
  res.json(department);
});

app.post("/api/departments", async (req, res) => {
  const { name, description = "" } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ message: "Department name is required" });
  const result = await pool.query(
    "INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *",
    [name.trim(), description.trim()]
  );
  res.status(201).json(result.rows[0]);
});

app.put("/api/departments/:id", async (req, res) => {
  const { name, description = "" } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ message: "Department name is required" });
  const result = await pool.query(
    "UPDATE departments SET name = $1, description = $2 WHERE id = $3 RETURNING *",
    [name.trim(), description.trim(), req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ message: "Department not found" });
  res.json(result.rows[0]);
});

app.delete("/api/departments/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM departments WHERE id = $1", [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ message: "Department not found" });
  res.status(204).send();
});

app.get("/api/charters", async (req, res) => {
  const { departmentId } = req.query;
  const conditions = [];
  const params = [];
  if (departmentId) {
    conditions.push("department_id = ?");
    params.push(departmentId);
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
  const [result] = await pool.query(
    "INSERT INTO charters (department_id, title, content, file_path) VALUES (?, ?, ?, ?)",
    [department_id, title.trim(), content.trim(), file_path]
  );
  const [rows] = await pool.query("SELECT * FROM charters WHERE id = ?", [result.insertId]);
  res.status(201).json(rows[0]);
});

app.put("/api/charters/:id", async (req, res) => {
  const { department_id, title, content, file_path = null } = req.body || {};
  if (!department_id || !title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: "department_id, title, and content are required" });
  }
  const [result] = await pool.query(
    "UPDATE charters SET department_id = ?, title = ?, content = ?, file_path = ? WHERE id = ?",
    [department_id, title.trim(), content.trim(), file_path, req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ message: "Charter not found" });
  const [rows] = await pool.query("SELECT * FROM charters WHERE id = ?", [req.params.id]);
  res.json(rows[0]);
});

app.delete("/api/charters/:id", async (req, res) => {
  const [result] = await pool.query("DELETE FROM charters WHERE id = ?", [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ message: "Charter not found" });
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
  const [result] = await pool.query(
    "INSERT INTO ratings (charter_id, rating, comment) VALUES (?, ?, ?)",
    [req.params.id, parsedRating, comment.trim()]
  );
  const [rows] = await pool.query("SELECT * FROM ratings WHERE id = ?", [result.insertId]);
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

  const [result] = await pool.query(
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
  const [rows] = await pool.query(
    "SELECT * FROM feedback_responses WHERE id = ?",
    [result.insertId]
  );
  res.status(201).json(rows[0]);
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM admins WHERE username = ?", [
      username,
    ]);
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
