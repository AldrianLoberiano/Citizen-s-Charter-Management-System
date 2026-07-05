import "dotenv/config";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
};

if (String(process.env.DB_SSL || "").toLowerCase() === "true") {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(dbConfig);

pool.getConnection()
  .then((conn) => {
    console.log("Connected to MySQL!");
    conn.release();
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

export { pool };