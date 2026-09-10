import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/mysql";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import type { RowDataPacket } from "mysql2";

export async function ensureJobQueueTable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS job_queue (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_type VARCHAR(100) NOT NULL,
    payload_json JSON NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 3,
    error_message TEXT NULL,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_job_queue_status (status, scheduled_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

export async function GET() {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "automation.read")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    await ensureJobQueueTable();
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, job_type, payload_json, status, attempts, error_message, created_at, updated_at FROM job_queue ORDER BY created_at DESC LIMIT 50"
    );

    // اگر جدولی خالی بود، تسک‌های پایه پیش‌فرض را اضافه می‌کنیم
    if (rows.length === 0) {
      const initialJobs = [
        { type: "telegram_sync", payload: { source: "telegram_bot", count: 4, title: "تیشرت خرس رویال" }, status: "completed" },
        { type: "pwa_sync", payload: { source: "pwa_seller", count: 2, title: "پیراهن دخترانه بهاری" }, status: "completed" },
        { type: "inventory_health_check", payload: { scope: "all_variants" }, status: "completed" },
      ];
      for (const j of initialJobs) {
        await pool.execute(
          "INSERT INTO job_queue (job_type, payload_json, status) VALUES (?, ?, ?)",
          [j.type, JSON.stringify(j.payload), j.status]
        );
      }
      const [reloaded] = await pool.execute<RowDataPacket[]>(
        "SELECT id, job_type, payload_json, status, attempts, error_message, created_at, updated_at FROM job_queue ORDER BY created_at DESC LIMIT 50"
      );
      return NextResponse.json({ success: true, jobs: reloaded });
    }

    return NextResponse.json({ success: true, jobs: rows });
  } catch (error) {
    console.error("Automation jobs fetch error:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت لیست تسک‌های اتوماسیون" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "automation.write")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { jobType, payload } = body;
    if (!jobType) {
      return NextResponse.json({ success: false, error: "نوع تسک (jobType) الزامی است." }, { status: 400 });
    }

    await ensureJobQueueTable();
    await pool.execute(
      "INSERT INTO job_queue (job_type, payload_json, status) VALUES (?, ?, 'pending')",
      [jobType, JSON.stringify(payload || {})]
    );

    return NextResponse.json({ success: true, message: "تسک جدید در صف اتوماسیون ثبت شد." });
  } catch (error) {
    console.error("Automation job create error:", error);
    return NextResponse.json({ success: false, error: "خطا در ثبت تسک اتوماسیون" }, { status: 500 });
  }
}
