import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL!");
});

pool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err);
});

export { pool as pgPool };
