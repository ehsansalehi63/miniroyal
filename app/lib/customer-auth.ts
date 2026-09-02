import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import pool from "./mysql";

const scrypt = promisify(nodeScrypt);
const COOKIE_NAME = "miniroyal_customer_session";
const SESSION_DAYS = 30;

async function ensureCustomerSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(20) NOT NULL UNIQUE,
      email VARCHAR(150) NULL UNIQUE,
      password_hash VARCHAR(255) NULL,
      full_name VARCHAR(150) NULL,
      role ENUM('customer','vip','wholesale') NOT NULL DEFAULT 'customer',
      club_points INT UNSIGNED NOT NULL DEFAULT 0,
      club_tier ENUM('bronze','silver','gold') NOT NULL DEFAULT 'bronze',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [, salt, key] = stored.split("$");
  if (!salt || !key) return false;
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(key, "hex");
  return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
}

function sessionSecret() {
  return process.env.AUTH_SESSION_SECRET || process.env.PAYMENT_STATE_SECRET || "";
}

function signSession(customerId: number) {
  const payload = `${customerId}.${Date.now() + SESSION_DAYS * 86400000}`;
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function readSession(value: string | undefined) {
  if (!value || !sessionSecret()) return null;
  const [id, expires, signature] = value.split(".");
  if (!id || !expires || !signature || Number(expires) < Date.now()) return null;
  const expected = createHmac("sha256", sessionSecret()).update(`${id}.${expires}`).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return Number.isSafeInteger(Number(id)) ? Number(id) : null;
}

export async function registerCustomer(input: { fullName: string; phone: string; email?: string; password: string }) {
  if (!sessionSecret()) throw new Error("AUTH_SESSION_SECRET is not configured.");
  await ensureCustomerSchema();
  const passwordHash = await hashPassword(input.password);
  const [result] = await pool.execute(
    "INSERT INTO customers (full_name, phone, email, password_hash) VALUES (?, ?, ?, ?)",
    [input.fullName, input.phone, input.email || null, passwordHash]
  ) as unknown as [{ insertId: number }];
  await setSession(result.insertId);
  return { id: result.insertId, fullName: input.fullName, phone: input.phone, email: input.email || null };
}

export async function loginCustomer(phone: string, password: string) {
  if (!sessionSecret()) throw new Error("AUTH_SESSION_SECRET is not configured.");
  await ensureCustomerSchema();
  const [rows] = await pool.execute(
    "SELECT id, full_name, phone, email, password_hash, is_active FROM customers WHERE phone = ? LIMIT 1",
    [phone]
  ) as unknown as [Array<{ id: number; full_name: string; phone: string; email: string | null; password_hash: string | null; is_active: number }>];
  const customer = rows[0];
  if (!customer?.is_active || !customer.password_hash || !(await verifyPassword(password, customer.password_hash))) return null;
  await pool.execute("UPDATE customers SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [customer.id]);
  await setSession(customer.id);
  return { id: customer.id, fullName: customer.full_name, phone: customer.phone, email: customer.email };
}

export async function currentCustomer() {
  const session = (await cookies()).get(COOKIE_NAME)?.value;
  const customerId = readSession(session);
  if (!customerId) return null;
  await ensureCustomerSchema();
  const [rows] = await pool.execute(
    "SELECT id, full_name, phone, email, role, club_points, club_tier FROM customers WHERE id = ? AND is_active = 1 LIMIT 1",
    [customerId]
  ) as unknown as [Array<{ id: number; full_name: string; phone: string; email: string | null; role: string; club_points: number; club_tier: string }>];
  const customer = rows[0];
  return customer ? { id: customer.id, fullName: customer.full_name, phone: customer.phone, email: customer.email, role: customer.role, clubPoints: customer.club_points, clubTier: customer.club_tier } : null;
}

export async function setSession(customerId: number) {
  (await cookies()).set(COOKIE_NAME, signSession(customerId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}
