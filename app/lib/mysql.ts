import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

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

export async function inspectDatabase() {
  let connection: mysql.PoolConnection | undefined;
  try {
    connection = await pool.getConnection();
    await connection.query("SELECT 1");
    const [databaseRows] = await connection.query<(RowDataPacket & { databaseName: string | null })[]>(
      "SELECT DATABASE() AS databaseName"
    );
    const [tableRows] = await connection.query<(RowDataPacket & { tableName: string })[]>(
      `SELECT TABLE_NAME AS tableName
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN ('customers', 'orders', 'order_items')`
    );
    const tables = tableRows.map((row) => row.tableName);
    const requiredTables = ["customers", "orders", "order_items"];
    const missingTables = requiredTables.filter((table) => !tables.includes(table));
    let orderQueryError: string | undefined;
    if (missingTables.length === 0) {
      try {
        await connection.query(
          `SELECT order_number, customer_id, status, total_amount, discount_amount,
                  shipping_amount, final_amount, payment_status, payment_method,
                  shipping_address_json, shipping_provider, created_at
           FROM orders LIMIT 1`
        );
      } catch (error) {
        const queryError = error as NodeJS.ErrnoException;
        orderQueryError = queryError.code ?? "ORDER_QUERY_ERROR";
      }
    }
    return {
      ok: missingTables.length === 0 && !orderQueryError,
      databaseName: databaseRows[0]?.databaseName ?? null,
      tables,
      missingTables,
      orderQueryError,
    };
  } catch (error) {
    const dbError = error as NodeJS.ErrnoException;
    return {
      ok: false,
      databaseName: null,
      tables: [],
      missingTables: ["customers", "orders", "order_items"],
      errorCode: dbError.code ?? "DB_ERROR",
    };
  } finally {
    connection?.release();
  }
}

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
