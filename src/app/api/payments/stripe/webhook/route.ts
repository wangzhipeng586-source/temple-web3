import { markOrderPaid } from "@/lib/orders";
import { verifyStripeSignature } from "@/lib/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "未配置 STRIPE_WEBHOOK_SECRET" }, { status: 501 });
  }
  const raw = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  if (!verifyStripeSignature(raw, signature, secret)) {
    return Response.json({ error: "签名无效" }, { status: 400 });
  }
  try {
    const event = JSON.parse(raw) as {
      type?: string;
      data?: { object?: { id?: string; metadata?: { orderId?: string } } };
    };
    if (event.type === "checkout.session.completed") {
      const orderId = event.data?.object?.metadata?.orderId;
      const paymentRef = event.data?.object?.id;
      if (!orderId || !paymentRef) {
        return Response.json({ error: "缺少订单信息" }, { status: 400 });
      }
      await markOrderPaid(orderId, { provider: "STRIPE", paymentRef });
    }
  } catch (error) {
    console.error(error);
    return Response.json({ error: "无法处理事件" }, { status: 400 });
  }
  return Response.json({ received: true });
}
