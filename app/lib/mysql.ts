import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "miniroyal",
  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout: 4000,
  queueLimit: 0,
});

export default pool;

export async function query<T>(sql: string, params?: (string | number | boolean | null)[]): Promise<T> {
  try {
    const [rows] = await pool.execute(sql, params as (string | number | boolean | null)[]);
    return rows as T;
  } catch (err: any) {
    console.warn("⚠️ MySQL query warning (falling back gracefully):", err.message || err);
    return [] as unknown as T;
  }
}
