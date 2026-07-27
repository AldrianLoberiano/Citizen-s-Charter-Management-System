import "dotenv/config";

let pool;

if (process.env.DATABASE_URL) {
  // PostgreSQL
  const pg = await import("pg");
  const pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  pgPool.on("connect", () => console.log("Connected to PostgreSQL!"));
  pgPool.on("error", (err) => console.error("PostgreSQL error:", err));

  // Wrap to match MySQL2 API: pool.query(sql, params) => [rows, fields]
  pool = {
    async query(sql, params = []) {
      // Convert ? placeholders to $1, $2, ... for PostgreSQL
      let paramIndex = 0;
      let pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);

      // Append RETURNING id for INSERT if not already present
      if (/^\s*INSERT\b/i.test(pgSql.trim()) && !/RETURNING/i.test(pgSql)) {
        pgSql += " RETURNING id";
      }

      const result = await pgPool.query(pgSql, params);

      // Simulate MySQL2 insert result
      if (result.command === "INSERT" && result.rows.length > 0) {
        return [[{ insertId: result.rows[0].id, affectedRows: result.rowCount }], []];
      }
      // Simulate MySQL2 update/delete result
      if (result.command === "UPDATE" || result.command === "DELETE") {
        return [[{ affectedRows: result.rowCount }], []];
      }
      // Default: return rows like MySQL
      return [result.rows, []];
    },
    async getConnection() {
      return pgPool.connect();
    },
    async end() {
      return pgPool.end();
    },
  };
} else {
  // MySQL
  const mysql = await import("mysql2/promise");
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
  pool = mysql.createPool(dbConfig);
  pool.getConnection()
    .then((conn) => { console.log("Connected to MySQL!"); conn.release(); })
    .catch((err) => console.error("Database connection failed:", err));
}

export { pool };
