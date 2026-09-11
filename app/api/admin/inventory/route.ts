import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import pool from "@/app/lib/mysql";
import { refreshProductCatalog } from "@/app/lib/revalidate";

export async function PATCH(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "inventory.write")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const variantId = Number(body.variantId);
    const newStock = typeof body.stock === "number" ? Math.max(0, Math.round(body.stock)) : null;
    const delta = typeof body.delta === "number" ? Math.round(body.delta) : null;

    if (!variantId || (!Number.isFinite(newStock) && !Number.isFinite(delta))) {
      return NextResponse.json(
        { success: false, error: "اطلاعات تنوع یا موجودی ارسالی معتبر نیست." },
        { status: 400 }
      );
    }

    if (newStock !== null) {
      await pool.execute("UPDATE product_variants SET stock = ? WHERE id = ?", [newStock, variantId]);
    } else if (delta !== null) {
      await pool.execute(
        "UPDATE product_variants SET stock = GREATEST(0, stock + ?) WHERE id = ?",
        [delta, variantId]
      );
    }

    // اگر جدول inventory_balances هم وجود دارد، با آن همگام می‌کنیم
    try {
      if (newStock !== null) {
        await pool.execute(
          `INSERT INTO inventory_balances (warehouse_id, variant_id, on_hand)
           VALUES (1, ?, ?)
           ON DUPLICATE KEY UPDATE on_hand = VALUES(on_hand), updated_at = CURRENT_TIMESTAMP`,
          [variantId, newStock]
        );
      }
    } catch {}

    const [rows] = await pool.execute(
      "SELECT id, stock FROM product_variants WHERE id = ? LIMIT 1",
      [variantId]
    ) as unknown as [Array<{ id: number; stock: number }>];

    refreshProductCatalog();

    return NextResponse.json({
      success: true,
      variantId,
      stock: rows[0]?.stock ?? newStock,
    });
  } catch (error) {
    console.error("Admin inventory update failed:", error);
    return NextResponse.json(
      { success: false, error: "بروزرسانی موجودی در دیتابیس انجام نشد." },
      { status: 500 }
    );
  }
}
