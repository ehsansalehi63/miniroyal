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
    const discount = 0;
    const shippingCost = subtotal >= 500000 ? 0 : 45000;
    const finalTotal = subtotal - discount + shippingCost;
    const orderNumber = `MR-${Date.now().toString().slice(-8)}`;
    const shippingAddress = JSON.stringify({
      recipientName: input.recipientName.trim(),
      phone: input.phone.trim(),
      province: input.province.trim(),
      city: input.city.trim(),
      address: input.address.trim(),
      postalCode: input.postalCode.trim(),
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

export async function listOrders() {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT o.order_number AS orderNumber,
      c.full_name AS recipientName, c.phone,
      o.final_amount AS finalTotal, o.status,
      o.payment_method AS paymentMethod, o.shipping_provider AS shippingProvider,
      o.payment_status AS paymentStatus, o.created_at AS createdAt
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     ORDER BY o.created_at DESC`
  );
  return rows;
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
