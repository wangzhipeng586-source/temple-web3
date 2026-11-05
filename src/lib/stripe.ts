import { createHmac, timingSafeEqual } from "crypto";

export function verifyStripeSignature(raw: string, header: string, webhookSecret: string, now = Date.now()) {
  const items = header.split(",").map((part) => {
    const index = part.indexOf("=");
    return [part.slice(0, index), part.slice(index + 1)] as const;
  });
  const timestamp = items.find(([key]) => key === "t")?.[1];
  const signatures = items.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || signatures.length === 0) return false;
  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(now - timestampMs) > 5 * 60 * 1000) return false;
  const expected = createHmac("sha256", webhookSecret).update(`${timestamp}.${raw}`).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  return signatures.some((signature) => {
    const actual = Buffer.from(signature);
    return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
  });
}

export async function createStripeCheckout(order: {
  id: string;
  number: string;
  amountCents: number;
  currency: string;
  title: string;
}) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("未配置 STRIPE_SECRET_KEY");
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${appUrl}/orders/${order.number}?stripe=success`,
    cancel_url: `${appUrl}/orders/${order.number}?stripe=cancel`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": order.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(order.amountCents),
    "line_items[0][price_data][product_data][name]": order.title,
    "metadata[orderId]": order.id,
    "metadata[orderNumber]": order.number,
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !json.url || !json.id) {
    throw new Error(json.error?.message || "创建支付页面失败");
  }
  return { id: json.id, url: json.url };
}
