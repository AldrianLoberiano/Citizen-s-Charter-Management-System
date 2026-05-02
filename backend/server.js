import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
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
  const [result] = await pool.query(
    "INSERT INTO departments (name, description) VALUES (?, ?)",
    [name.trim(), description.trim()]
  );
  const [rows] = await pool.query("SELECT * FROM departments WHERE id = ?", [result.insertId]);
  res.status(201).json(rows[0]);
});

app.put("/api/departments/:id", async (req, res) => {
  const { name, description = "" } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ message: "Department name is required" });
  const [result] = await pool.query(
    "UPDATE departments SET name = ?, description = ? WHERE id = ?",
    [name.trim(), description.trim(), req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ message: "Department not found" });
  const [rows] = await pool.query("SELECT * FROM departments WHERE id = ?", [req.params.id]);
  res.json(rows[0]);
});

app.delete("/api/departments/:id", async (req, res) => {
  const [result] = await pool.query("DELETE FROM departments WHERE id = ?", [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ message: "Department not found" });
  res.status(204).send();
});

app.get("/api/charters", async (req, res) => {
  const { departmentId } = req.query;
  const sql = departmentId
    ? "SELECT * FROM charters WHERE department_id = ? ORDER BY id ASC"
    : "SELECT * FROM charters ORDER BY id ASC";
  const params = departmentId ? [departmentId] : [];
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

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = await bcrypt.hash(`${username}:${Date.now()}`, 8);
  res.json({
    token,
    user: { username },
  });
});

app.listen(port, () => {
  console.log(`CCMS backend listening on http://localhost:${port}`);
});
