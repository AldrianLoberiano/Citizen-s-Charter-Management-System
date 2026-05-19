import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const useSsl = String(process.env.DB_SSL || "").toLowerCase() === "true";

export const pool = new Pool({
  host: process.env.DB_HOST || "127.0.0.1",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ccms_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
