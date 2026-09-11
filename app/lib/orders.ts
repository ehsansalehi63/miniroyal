import pool from "./mysql";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { refreshProductCatalog } from "./revalidate";

export type OrderItemInput = {
  product: {
    id: number;
    title: string;
    images: string[];
    salePrice?: number;
    basePrice: number;
  };
  variant: {
    id: number;
    sku: string;
    size: string;
    color: string;
    priceAdjustment: number;
  };
  quantity: number;
};

export type CreateOrderInput = {
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  shippingProvider: "postex" | "tipax" | "post" | "peyk";
  paymentMethod: "zarinpal" | "cod";
  subtotal?: number;
  discount?: number;
  shippingCost?: number;
  finalTotal?: number;
  latitude?: number | null;
  longitude?: number | null;
  items: OrderItemInput[];
};

function dbPaymentMethod(method: CreateOrderInput["paymentMethod"]) {
  return method === "zarinpal" ? "online" : "cod";
}

function dbPaymentStatus(status: string) {
  if (status === "paid") return "paid";
  if (status === "failed") return "failed";
  if (status === "refunded") return "refunded";
  return "unpaid";
}

export async function createOrder(input: CreateOrderInput) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [customerResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO customers (phone, full_name) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), updated_at = CURRENT_TIMESTAMP`,
      [input.phone.trim(), input.recipientName.trim()]
    );
    const customerId = customerResult.insertId || (
      await connection.execute<RowDataPacket[]>(
        "SELECT id FROM customers WHERE phone = ? LIMIT 1",
        [input.phone.trim()]
      )
    )[0][0]?.id;
    if (!customerId) throw new Error("Customer was not created.");

    const subtotal = input.items.reduce((sum, item) => {
      const unitPrice = (item.product.salePrice ?? item.product.basePrice) + item.variant.priceAdjustment;
      return sum + unitPrice * item.quantity;
    }, 0);
    // کوپن اعمال‌شده سمت کلاینت را با سقف امن سمت سرور محدود می‌کنیم.
    const requestedDiscount = Number(input.discount);
    const discount = Number.isFinite(requestedDiscount) ? Math.max(0, Math.min(requestedDiscount, subtotal)) : 0;
    // ارسال رایگان مثل سبد خرید بر اساس مبلغ کالاها (قبل از تخفیف) محاسبه می‌شود.
    // اگر کاربر روش پستکس را انتخاب کرده باشد، هزینه واقعی استعلامی همان لحظه ثبت شده است.
    const freeShippingThreshold = 500000;
    const isFreeShipping = subtotal >= freeShippingThreshold;
    const requestedShippingCost = Number(input.shippingCost);
    const fallbackShippingCost = input.shippingProvider === "tipax" ? 75000 : 45000;
    const shippingCost = isFreeShipping
      ? 0
      : (Number.isFinite(requestedShippingCost) && requestedShippingCost >= 0
        ? Math.round(requestedShippingCost)
        : fallbackShippingCost);
    const finalTotal = Math.max(0, subtotal - discount) + shippingCost;
    const orderNumber = `MR-${Date.now().toString().slice(-8)}`;
    const shippingAddress = JSON.stringify({
      recipientName: input.recipientName.trim(),
      phone: input.phone.trim(),
      province: input.province.trim(),
      city: input.city.trim(),
      address: input.address.trim(),
      postalCode: input.postalCode.trim(),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    });

    // Lock and decrement each variant inside the same transaction. This prevents
    // two simultaneous checkouts from selling more than the available stock.
    for (const item of input.items) {
      const [variantRows] = await connection.execute<RowDataPacket[]>(
        "SELECT id, stock FROM product_variants WHERE id = ? FOR UPDATE",
        [item.variant.id]
      );
      const variant = variantRows[0];
      if (!variant || Number(variant.stock) < item.quantity) {
        throw new Error(`موجودی «${item.product.title}» برای این ترکیب کافی نیست.`);
      }
      await connection.execute(
        "UPDATE product_variants SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [item.quantity, item.variant.id]
      );
    }

    const [orderResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO orders
       (order_number, customer_id, status, total_amount, discount_amount, shipping_amount,
        final_amount, payment_status, payment_method, shipping_address_json, shipping_provider)
       VALUES (?, ?, 'processing', ?, ?, ?, ?, 'unpaid', ?, ?, ?)`,
      [
        orderNumber,
        customerId,
        subtotal,
        discount,
        shippingCost,
        finalTotal,
        dbPaymentMethod(input.paymentMethod),
        shippingAddress,
        input.shippingProvider,
      ]
    );

    for (const item of input.items) {
      const unitPrice = (item.product.salePrice ?? item.product.basePrice) + item.variant.priceAdjustment;
      const variantInfo = JSON.stringify({
        sku: item.variant.sku,
        size: item.variant.size,
        color: item.variant.color,
      });
      await connection.execute<ResultSetHeader>(
        `INSERT INTO order_items
         (order_id, product_id, variant_id, product_title, variant_info, unit_price, quantity, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderResult.insertId,
          item.product.id,
          item.variant.id,
          item.product.title,
          variantInfo,
          unitPrice,
          item.quantity,
          unitPrice * item.quantity,
        ]
      );
    }

    await connection.commit();
    refreshProductCatalog();
    return { orderNumber, orderId: orderResult.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function findOrder(identifier: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT o.order_number AS orderNumber,
      c.full_name AS recipientName, c.phone,
      JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address_json, '$.province')) AS province,
      JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address_json, '$.city')) AS city,
      JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address_json, '$.address')) AS address,
      JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address_json, '$.postalCode')) AS postalCode,
      o.final_amount AS finalTotal, o.shipping_provider AS shippingProvider,
      o.postex_parcel_no AS postexParcelNo, o.postex_order_no AS postexOrderNo,
      o.tracking_code AS trackingCode, o.tracking_status AS trackingStatus,
      o.status, o.payment_status AS paymentStatus, o.payment_method AS paymentMethod,
      o.payment_ref_id AS refId, o.created_at AS createdAt,
      GROUP_CONCAT(
        JSON_OBJECT(
          'title', oi.product_title,
          'variantInfo', oi.variant_info,
          'quantity', oi.quantity,
          'unitPrice', oi.unit_price
        ) SEPARATOR '||'
      ) AS items_json
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.order_number = ? OR c.phone = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT 1`,
    [identifier.trim(), identifier.trim()]
  );
  return rows[0] ?? null;
}

export async function updatePayment(
  orderNumber: string,
  patch: { authority?: string; paymentStatus?: string; refId?: string }
) {
  const fields: string[] = [];
  const values: string[] = [];
  if (patch.authority) {
    fields.push("payment_ref_id = ?");
    values.push(patch.authority);
  }
  if (patch.refId) {
    fields.push("payment_ref_id = ?");
    values.push(patch.refId);
  }
  if (patch.paymentStatus) {
    fields.push("payment_status = ?");
    values.push(dbPaymentStatus(patch.paymentStatus));
  }
  if (!fields.length) return;
  values.push(orderNumber);
  await pool.execute(
    `UPDATE orders SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?`,
    values
  );
}

export async function updateTipaxShipment(
  orderNumber: string,
  patch: { barcode?: string; orderNo?: string; trackingCode?: string; trackingStatus?: string }
) {
  const fields: string[] = ["shipping_provider = 'tipax'"];
  const values: (string | number)[] = [];
  const tracking = patch.barcode || patch.trackingCode;
  if (tracking) {
    fields.push("postex_parcel_no = ?");
    values.push(tracking);
    fields.push("tracking_code = ?");
    values.push(tracking);
  }
  if (patch.orderNo) {
    fields.push("postex_order_no = ?");
    values.push(patch.orderNo);
  }
  if (patch.trackingStatus) {
    fields.push("tracking_status = ?");
    values.push(patch.trackingStatus);
  }
  values.push(orderNumber);
  await pool.execute(
    `UPDATE orders SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?`,
    values
  );
}

export async function updatePostexShipment(orderNumber: string, patch: { parcelNo?: string; postexOrderNo?: string; trackingCode?: string; trackingStatus?: string }) {
  return updateTipaxShipment(orderNumber, {
    barcode: patch.parcelNo,
    orderNo: patch.postexOrderNo,
    trackingCode: patch.trackingCode,
    trackingStatus: patch.trackingStatus,
  });
}

export async function listOrders() {
  const baseQuery = `SELECT o.order_number AS orderNumber,
      c.full_name AS recipientName, c.phone,
      o.final_amount AS finalTotal, o.status,
      o.payment_method AS paymentMethod, o.shipping_provider AS shippingProvider,
      o.payment_status AS paymentStatus, o.created_at AS createdAt,
      JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address_json, '$.province')) AS province,
      JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address_json, '$.city')) AS city,
      JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address_json, '$.address')) AS address,
      JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address_json, '$.postalCode')) AS postalCode
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     ORDER BY o.created_at DESC`;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      baseQuery.replace(
        "     FROM orders o",
        "      , o.postex_parcel_no AS postexParcelNo, o.postex_order_no AS postexOrderNo,\n      o.tracking_code AS trackingCode, o.tracking_status AS trackingStatus\n     FROM orders o"
      )
    );
    return rows;
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : "";
    if (!["ER_BAD_FIELD_ERROR", "ER_BAD_TABLE_ERROR"].includes(code)) throw error;
    // Keep the admin list usable while migration 008 is pending on production.
    const [rows] = await pool.execute<RowDataPacket[]>(baseQuery);
    return rows.map((row) => Object.assign(row, { postexParcelNo: null, postexOrderNo: null, trackingCode: null, trackingStatus: null }));
  }
}

export async function updateOrderStatus(orderNumber: string, status: string) {
  const allowed = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) throw new Error("Invalid order status.");
  await pool.execute(
    "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?",
    [status, orderNumber]
  );
}

export async function listCustomers() {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.id, c.full_name AS name, c.phone, c.email,
        COALESCE(c.role, 'customer') AS role,
        COALESCE(c.club_tier, 'bronze') AS clubTier,
        COALESCE(c.club_points, 0) AS points,
        COALESCE(c.is_active, 1) AS isActive,
        c.created_at AS createdAt,
        COUNT(o.id) AS ordersCount,
        COALESCE(SUM(o.final_amount), 0) AS totalSpent
       FROM customers c
       LEFT JOIN orders o ON o.customer_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    return rows;
  } catch {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.id, c.full_name AS name, c.phone, c.created_at AS createdAt,
        COUNT(o.id) AS ordersCount, COALESCE(SUM(o.final_amount), 0) AS totalSpent
       FROM customers c
       LEFT JOIN orders o ON o.customer_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    return rows;
  }
}

export async function updateCustomer(
  id: number,
  patch: { role?: string; clubTier?: string; points?: number; isActive?: boolean }
) {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (patch.role && ["customer", "vip", "wholesale"].includes(patch.role)) {
    fields.push("role = ?");
    values.push(patch.role);
  }
  if (patch.clubTier && ["bronze", "silver", "gold"].includes(patch.clubTier)) {
    fields.push("club_tier = ?");
    values.push(patch.clubTier);
  }
  if (typeof patch.points === "number") {
    fields.push("club_points = ?");
    values.push(Math.max(0, Math.round(patch.points)));
  }
  if (typeof patch.isActive === "boolean") {
    fields.push("is_active = ?");
    values.push(patch.isActive ? 1 : 0);
  }

  if (!fields.length) return;
  values.push(id);
  await pool.execute(`UPDATE customers SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
}

export type SalesAnalytics = {
  dailySales: { saleDate: string; orderCount: number; totalRevenue: number }[];
  topProducts: { productId: number; title: string; totalSold: number; totalAmount: number }[];
  statusBreakdown: { status: string; count: number }[];
};

export async function getSalesAnalytics(): Promise<SalesAnalytics> {
  try {
    const [dailyRows] = await pool.execute<RowDataPacket[]>(`
      SELECT DATE(created_at) as saleDate, COUNT(*) as orderCount, COALESCE(SUM(final_amount), 0) as totalRevenue
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY saleDate ASC
    `);

    const [topProducts] = await pool.execute<RowDataPacket[]>(`
      SELECT oi.product_id as productId, oi.product_title as title,
             SUM(oi.quantity) as totalSold, SUM(oi.total_price) as totalAmount
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled'
      GROUP BY oi.product_id, oi.product_title
      ORDER BY totalSold DESC
      LIMIT 5
    `);

    const [statusRows] = await pool.execute<RowDataPacket[]>(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);

    return {
      dailySales: (dailyRows as unknown[] as { saleDate: string; orderCount: number; totalRevenue: number }[]).map((r) => ({
        saleDate: String(r.saleDate),
        orderCount: Number(r.orderCount || 0),
        totalRevenue: Number(r.totalRevenue || 0),
      })),
      topProducts: (topProducts as unknown[] as { productId: number; title: string; totalSold: number; totalAmount: number }[]).map((r) => ({
        productId: Number(r.productId),
        title: String(r.title),
        totalSold: Number(r.totalSold || 0),
        totalAmount: Number(r.totalAmount || 0),
      })),
      statusBreakdown: (statusRows as unknown[] as { status: string; count: number }[]).map((r) => ({
        status: String(r.status),
        count: Number(r.count || 0),
      })),
    };
  } catch (err) {
    console.warn("getSalesAnalytics offline fallback:", err);
    return { dailySales: [], topProducts: [], statusBreakdown: [] };
  }
}
