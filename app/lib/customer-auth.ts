import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import pool from "./mysql";

const scrypt = promisify(nodeScrypt);
const COOKIE_NAME = "miniroyal_customer_session";
const SESSION_DAYS = 30;
const OTP_MINUTES = 10;
function envValue(value: string | undefined) {
  return (value || "").trim().replace(/^['"]|['"]$/g, "");
}

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
  try {
    await pool.execute("ALTER TABLE customers ADD COLUMN phone_verified_at TIMESTAMP NULL");
  } catch {}
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS customer_otps (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      code_hash CHAR(64) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      verified_at TIMESTAMP NULL,
      attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_customer_otps_phone (phone),
      INDEX idx_customer_otps_expiry (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function sendOtp(phone: string, code: string) {
  const provider = envValue(process.env.SMS_PROVIDER || "console").toLowerCase();
  const key = envValue(process.env.SMS_API_KEY);
  if (provider === "console") {
    if (process.env.NODE_ENV === "production") throw new Error("SMS_PROVIDER is not configured.");
    console.info(`[MiniRoyal OTP] ${phone}: ${code}`);
    return;
  }
  if (!key) throw new Error("SMS_API_KEY is not configured.");
  const text = `کد تایید مینی رویال: ${code}`;
  const lineNumber = envValue(process.env.SMS_LINE_NUMBER);
  const patternCode = envValue(process.env.SMS_PATTERN_CODE);
  if (provider === "iranpayamak" && patternCode) {
    if (!lineNumber) throw new Error("SMS_LINE_NUMBER is not configured.");
    const response = await fetch("https://api.iranpayamak.com/ws/v1/sms/pattern", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Api-Key": key,
      },
      body: JSON.stringify({
        code: patternCode,
        attributes: { var1: code },
        recipient: phone,
        line_number: lineNumber,
        number_format: "english",
        schedule: null,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.status !== "success") {
      console.warn("IranPayamak pattern OTP failed:", response.status, result);
      throw new Error("ارسال کد تایید از الگوی ایران‌پیامک انجام نشد.");
    }
    return;
  }
  if (provider === "kavenegar") {
    const url = `https://api.kavenegar.com/v1/${encodeURIComponent(key)}/sms/send.json`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ receptor: phone, message: text }),
    });
    if (!response.ok) throw new Error("SMS provider failed.");
    return;
  }
  if (provider === "smsir") {
    const response = await fetch("https://api.sms.ir/v1/send/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({ lineNumber: process.env.SMS_LINE_NUMBER, messageText: text, mobiles: [phone] }),
    });
    if (!response.ok) throw new Error("SMS provider failed.");
    return;
  }
  if (provider === "iranpayamak") {
    if (!lineNumber) throw new Error("SMS_LINE_NUMBER is not configured.");
    const response = await fetch("https://api.iranpayamak.com/ws/v1/sms/simple", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Api-Key": key,
      },
      body: JSON.stringify({
        text,
        line_number: lineNumber,
        recipients: [phone],
        number_format: "english",
        schedule: null,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.status !== "success") {
      console.warn("IranPayamak OTP failed:", response.status, result);
      throw new Error("ارسال پیامک از ایران‌پیامک انجام نشد.");
    }
    return;
  }
  throw new Error("Unsupported SMS_PROVIDER.");
}

function otpHash(phone: string, code: string) {
  return createHmac("sha256", sessionSecret() || "otp-fallback").update(`${phone}:${code}`).digest("hex");
}

export async function requestCustomerOtp(phone: string) {
  if (!/^\d{10,15}$/.test(phone)) throw new Error("شماره موبایل معتبر نیست.");
  await ensureCustomerSchema();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_MINUTES * 60_000);
  await pool.execute("INSERT INTO customer_otps (phone, code_hash, expires_at) VALUES (?, ?, ?)", [phone, otpHash(phone, code), expiresAt]);
  await sendOtp(phone, code);
}

export async function verifyCustomerOtp(phone: string, code: string) {
  await ensureCustomerSchema();
  const [rows] = await pool.execute(
    "SELECT id, code_hash, expires_at, attempts FROM customer_otps WHERE phone = ? AND verified_at IS NULL ORDER BY id DESC LIMIT 1",
    [phone]
  ) as unknown as [Array<{ id: number; code_hash: string; expires_at: Date; attempts: number }>];
  const otp = rows[0];
  if (!otp || new Date(otp.expires_at).getTime() < Date.now() || otp.attempts >= 5 || otpHash(phone, code) !== otp.code_hash) {
    if (otp) await pool.execute("UPDATE customer_otps SET attempts = attempts + 1 WHERE id = ?", [otp.id]);
    return false;
  }
  await pool.execute("UPDATE customer_otps SET verified_at = NOW() WHERE id = ?", [otp.id]);
  await pool.execute("UPDATE customers SET phone_verified_at = NOW() WHERE phone = ?", [phone]);
  return true;
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
  const [verifiedRows] = await pool.execute(
    "SELECT id FROM customer_otps WHERE phone = ? AND verified_at IS NOT NULL ORDER BY id DESC LIMIT 1",
    [input.phone]
  ) as unknown as [Array<{ id: number }>];
  if (!verifiedRows[0]) throw new Error("PHONE_NOT_VERIFIED");
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
    "SELECT id, full_name, phone, email, password_hash, is_active, phone_verified_at FROM customers WHERE phone = ? LIMIT 1",
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
