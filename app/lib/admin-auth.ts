import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import pool from "./mysql";
import { sendOtp } from "./sms";

const COOKIE_NAME = "miniroyal_admin_session";
const OTP_MINUTES = 10;
const SESSION_DAYS = 7;

function secret() {
  return process.env.AUTH_SESSION_SECRET || process.env.PAYMENT_STATE_SECRET || "";
}

function allowedPhones() {
  return (process.env.TRYON_ADMIN_PHONES || "").split(/[\s,;]+/).map((item) => item.replace(/\D/g, "")).filter(Boolean);
}

function otpHash(phone: string, code: string) {
  return createHmac("sha256", secret() || "admin-otp-fallback").update(`${phone}:${code}`).digest("hex");
}

function signSession(userId: number, role: string) {
  const payload = `${userId}.${role}.${Date.now() + SESSION_DAYS * 86400000}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function readSession(value?: string) {
  if (!value || !secret()) return null;
  const [id, role, expires, signature] = value.split(".");
  if (!id || !role || !expires || !signature || Number(expires) < Date.now()) return null;
  const expected = createHmac("sha256", secret()).update(`${id}.${role}.${expires}`).digest("hex");
  if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  return { id: Number(id), role };
}

async function ensureAdminSchema() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS admin_otps (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_otps_phone (phone)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

async function ensureOwner(phone: string) {
  const [rows] = await pool.execute("SELECT id, role, is_active, full_name, phone FROM users WHERE phone = ? LIMIT 1", [phone]) as unknown as [Array<{ id: number; role: string; is_active: number; full_name: string; phone: string }>];
  if (rows[0]) return rows[0];
  if (!allowedPhones().includes(phone)) return null;
  await pool.execute("INSERT INTO users (username, email, phone, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?, 'super_admin')", [phone, `${phone}@miniroyal.local`, phone, "otp-only", "مالک مینی رویال"]);
  const [created] = await pool.execute("SELECT id, role, is_active, full_name, phone FROM users WHERE phone = ? LIMIT 1", [phone]) as unknown as [Array<{ id: number; role: string; is_active: number; full_name: string; phone: string }>];
  return created[0] || null;
}

export async function requestAdminOtp(phoneInput: string) {
  const phone = phoneInput.replace(/\D/g, "");
  if (!/^\d{10,15}$/.test(phone)) throw new Error("شماره موبایل معتبر نیست.");
  if (!secret()) throw new Error("AUTH_SESSION_SECRET یا PAYMENT_STATE_SECRET تنظیم نشده است.");
  await ensureAdminSchema();
  const user = await ensureOwner(phone);
  if (!user || !user.is_active) throw new Error("این شماره در فهرست مدیران مجاز نیست.");
  const code = String(randomInt(100000, 1000000));
  await pool.execute("INSERT INTO admin_otps (phone, code_hash, expires_at) VALUES (?, ?, ?)", [phone, otpHash(phone, code), new Date(Date.now() + OTP_MINUTES * 60000)]);
  const result = await sendOtp(phone, code);
  return { channel: result.channel };
}

export async function verifyAdminOtp(phoneInput: string, codeInput: string) {
  const phone = phoneInput.replace(/\D/g, "");
  const code = codeInput.replace(/\D/g, "");
  await ensureAdminSchema();
  const [otpRows] = await pool.execute("SELECT id, code_hash, expires_at, attempts FROM admin_otps WHERE phone = ? AND verified_at IS NULL ORDER BY id DESC LIMIT 1", [phone]) as unknown as [Array<{ id: number; code_hash: string; expires_at: Date; attempts: number }>];
  const otp = otpRows[0];
  if (!otp || otp.attempts >= 5 || new Date(otp.expires_at).getTime() < Date.now() || otpHash(phone, code) !== otp.code_hash) {
    if (otp) await pool.execute("UPDATE admin_otps SET attempts = attempts + 1 WHERE id = ?", [otp.id]);
    return false;
  }
  const user = await ensureOwner(phone);
  if (!user || !user.is_active) return false;
  await pool.execute("UPDATE admin_otps SET verified_at = NOW() WHERE id = ?", [otp.id]);
  await pool.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);
  (await cookies()).set(COOKIE_NAME, signSession(user.id, user.role), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400 });
  return true;
}

export async function currentAdmin() {
  const session = readSession((await cookies()).get(COOKIE_NAME)?.value);
  if (!session) return null;
  const [rows] = await pool.execute("SELECT id, username, full_name, phone, role, is_active FROM users WHERE id = ? AND is_active = 1 LIMIT 1", [session.id]) as unknown as [Array<{ id: number; username: string; full_name: string; phone: string | null; role: string; is_active: number }>];
  const user = rows[0];
  return user && user.role === session.role ? user : null;
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export function canManage(admin: { role: string }, permission: string) {
  if (admin.role === "super_admin") return true;
  if (admin.role === "admin") return !permission.startsWith("admins.");
  if (admin.role === "editor") return permission.startsWith("products.");
  if (admin.role === "operator") return permission.endsWith(".read") || permission === "orders.write" || permission === "inventory.write";
  return false;
}
