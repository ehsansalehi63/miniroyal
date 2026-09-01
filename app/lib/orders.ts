import pool from "./mysql";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

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
  shippingProvider: "tipax" | "post" | "peyk";
  paymentMethod: "zarinpal" | "cod";
  items: OrderItemInput[];
};

export async function createOrder(input: CreateOrderInput) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [customerResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO customers (name, phone) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = CURRENT_TIMESTAMP`,
      [input.recipientName.trim(), input.phone.trim()]
    );
    const customerId = customerResult.insertId || (
      await connection.execute<RowDataPacket[]>(
        "SELECT id FROM customers WHERE phone = ? LIMIT 1", [input.phone.trim()]
      )
    )[0][0]?.id;
    if (!customerId) throw new Error("Customer was not created.");
    const subtotal = input.items.reduce((sum, item) => {
      const unitPrice = (item.product.salePrice ?? item.product.basePrice) + item.variant.priceAdjustment;
      return sum + unitPrice * item.quantity;
    }, 0);
    const discount = 0;
    const shippingCost = subtotal >= 500000 ? 0 : 45000;
    const finalTotal = subtotal + shippingCost;
    const orderNumber = `MR-${Date.now().toString().slice(-8)}`;
    const [orderResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO orders
       (order_number, customer_id, recipient_name, phone, province, city, address, postal_code,
        shipping_provider, payment_method, subtotal, discount, shipping_cost, final_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, customerId, input.recipientName.trim(), input.phone.trim(), input.province.trim(),
        input.city.trim(), input.address.trim(), input.postalCode.trim(), input.shippingProvider,
        input.paymentMethod, subtotal, discount, shippingCost, finalTotal]
    );
    for (const item of input.items) {
      const unitPrice = (item.product.salePrice ?? item.product.basePrice) + item.variant.priceAdjustment;
      await connection.execute<ResultSetHeader>(
        `INSERT INTO order_items
         (order_id, product_id, variant_id, sku, title, image_url, size_label, color_label, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderResult.insertId, item.product.id, item.variant.id, item.variant.sku, item.product.title,
          item.product.images[0] ?? null, item.variant.size, item.variant.color, unitPrice, item.quantity]
      );
    }
    await connection.commit();
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
    `SELECT o.*, GROUP_CONCAT(
      JSON_OBJECT('title', oi.title, 'sku', oi.sku, 'size', oi.size_label,
      'color', oi.color_label, 'quantity', oi.quantity, 'unitPrice', oi.unit_price)
      SEPARATOR '||'
    ) AS items_json
    FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.order_number = ? OR o.phone = ?
    GROUP BY o.id ORDER BY o.created_at DESC LIMIT 1`,
    [identifier.trim(), identifier.trim()]
  );
  return rows[0] ?? null;
}

export async function updatePayment(orderNumber: string, patch: { authority?: string; paymentStatus?: string; refId?: string }) {
  const fields: string[] = [];
  const values: (string | null)[] = [];
  if (patch.authority) { fields.push("authority = ?"); values.push(patch.authority); }
  if (patch.paymentStatus) { fields.push("payment_status = ?"); values.push(patch.paymentStatus); }
  if (patch.refId) { fields.push("ref_id = ?"); values.push(patch.refId); }
  if (!fields.length) return;
  values.push(orderNumber);
  await pool.execute(`UPDATE orders SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?`, values);
}

export async function listOrders() {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT order_number AS orderNumber, recipient_name AS recipientName, phone,
      final_total AS finalTotal, order_status AS status, payment_method AS paymentMethod,
      shipping_provider AS shippingProvider, payment_status AS paymentStatus, created_at AS createdAt
     FROM orders ORDER BY created_at DESC`
  );
  return rows;
}

export async function updateOrderStatus(orderNumber: string, status: string) {
  const allowed = ["processing", "packed", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) throw new Error("Invalid order status.");
  await pool.execute(
    "UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?",
    [status, orderNumber]
  );
}

export async function listCustomers() {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT c.id, c.name, c.phone, c.created_at AS createdAt,
      COUNT(o.id) AS ordersCount, COALESCE(SUM(o.final_total), 0) AS totalSpent
     FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
     GROUP BY c.id ORDER BY c.created_at DESC`
  );
  return rows;
}
