import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "miniroyal",
  waitForConnections: true,
  connectionLimit: 3,
  connectTimeout: 2000,
  queueLimit: 0,
});

export default pool;

export async function query<T>(sql: string, params?: (string | number | boolean | null)[]): Promise<T> {
  try {
    const queryPromise = pool.execute(sql, params as (string | number | boolean | null)[]);
    // Timeout query if it takes more than 1.5s to prevent blocking SSR render
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database query timeout")), 1500)
    );

    const [rows] = (await Promise.race([queryPromise, timeoutPromise])) as any[];
    return rows as T;
  } catch (err: any) {
    console.warn("⚠️ MySQL query graceful fallback:", err.message || err);
    return [] as unknown as T;
  }
}
