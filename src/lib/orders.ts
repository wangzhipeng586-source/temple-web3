import type { PaymentProviderName, ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cancelBlockReason, fulfillmentBlockReason, reviewBlockReason } from "@/lib/order-state";
import { numberPrefix } from "@/lib/labels";

export type PriceSnapshot = {
  serviceTitle: string;
  hallName: string;
  type: ServiceType;
  priceCents: number;
  currency: string;
  termDays: number | null;
  capturedAt: string;
};

function makeNumber(prefix: string) {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ymd}-${rand}`;
}

export function asPriceSnapshot(value: unknown): PriceSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.serviceTitle !== "string" || typeof record.priceCents !== "number") return null;
  return {
    serviceTitle: record.serviceTitle,
    hallName: typeof record.hallName === "string" ? record.hallName : "",
    type: (typeof record.type === "string" ? record.type : "PRAYER") as ServiceType,
    priceCents: record.priceCents,
    currency: typeof record.currency === "string" ? record.currency : "CNY",
    termDays: typeof record.termDays === "number" ? record.termDays : null,
    capturedAt: typeof record.capturedAt === "string" ? record.capturedAt : "",
  };
}

export async function submitApplication(input: {
  userId: string;
  hallSlug: string;
  type: ServiceType;
  slotId?: string | null;
  applicantName: string;
  contact: string;
  beneficiary: string;
  intention: string;
  note?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const service = await tx.hallService.findFirst({
      where: {
        type: input.type,
        enabled: true,
        hall: { slug: input.hallSlug, enabled: true },
      },
      include: { hall: true },
    });
    if (!service) throw new Error("该办理项目未开放");

    let slotId: string | null = null;
    if (input.slotId && input.type !== "PRAYER") {
      const held = await tx.offeringSlot.updateMany({
        where: {
          id: input.slotId,
          hallId: service.hallId,
          type: service.type,
          status: "AVAILABLE",
        },
        data: { status: "HELD" },
      });
      if (held.count !== 1) throw new Error("所选位置已不可用，请重新选择");
      slotId = input.slotId;
    }

    return tx.application.create({
      data: {
        number: makeNumber(numberPrefix(service.type)),
        type: service.type,
        status: "SUBMITTED",
        userId: input.userId,
        hallId: service.hallId,
        hallServiceId: service.id,
        slotId,
        applicantName: input.applicantName,
        contact: input.contact,
        beneficiary: input.beneficiary,
        intention: input.intention,
        note: input.note || null,
        serviceTitle: service.title,
        priceCents: service.priceCents,
        currency: service.currency,
        hallName: service.hall.name,
        events: {
          create: { action: "SUBMITTED", note: "信众提交申请", actorId: input.userId },
        },
      },
    });
  });
}

async function releaseHeldSlot(slotId: string | null, tx: Pick<typeof prisma, "offeringSlot">) {
  if (!slotId) return;
  await tx.offeringSlot.updateMany({
    where: { id: slotId, status: "HELD" },
    data: { status: "AVAILABLE" },
  });
}

export async function approveApplication(id: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id },
      include: { hallService: true, order: true },
    });
    if (!application) throw new Error("申请不存在");
    const reason = reviewBlockReason(application.status);
    if (reason) throw new Error(reason);
    if (application.order) throw new Error("订单已存在");

    const updated = await tx.application.updateMany({
      where: { id, status: "SUBMITTED" },
      data: { status: "APPROVED" },
    });
    if (updated.count !== 1) throw new Error("申请状态已变化，请刷新");

    const snapshot: PriceSnapshot = {
      serviceTitle: application.serviceTitle,
      hallName: application.hallName,
      type: application.type,
      priceCents: application.priceCents,
      currency: application.currency,
      termDays: application.hallService.termDays,
      capturedAt: new Date().toISOString(),
    };
    const order = await tx.order.create({
      data: {
        number: makeNumber("OD"),
        applicationId: application.id,
        status: "PENDING_PAYMENT",
        fulfillment: "PENDING",
        amountCents: application.priceCents,
        currency: application.currency,
        priceSnapshot: snapshot,
        provider: "MOCK",
      },
    });
    await tx.applicationEvent.create({
      data: {
        applicationId: id,
        action: "APPROVED",
        note: "审核通过，等待支付",
        actorId,
      },
    });
    return order;
  });
}

export async function rejectApplication(id: string, actorId: string, reviewNote: string) {
  await prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({ where: { id } });
    if (!application) throw new Error("申请不存在");
    const reason = reviewBlockReason(application.status);
    if (reason) throw new Error(reason);
    const updated = await tx.application.updateMany({
      where: { id, status: "SUBMITTED" },
      data: { status: "REJECTED", reviewNote: reviewNote || null },
    });
    if (updated.count !== 1) throw new Error("申请状态已变化，请刷新");
    await releaseHeldSlot(application.slotId, tx);
    await tx.applicationEvent.create({
      data: { applicationId: id, action: "REJECTED", note: reviewNote || "已驳回", actorId },
    });
  });
}

export async function cancelApplication(id: string, userId: string) {
  await prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({ where: { id } });
    if (!application || application.userId !== userId) throw new Error("申请不存在");
    const reason = cancelBlockReason(application.status);
    if (reason) throw new Error(reason);
    const updated = await tx.application.updateMany({
      where: { id, status: "SUBMITTED", userId },
      data: { status: "CANCELLED" },
    });
    if (updated.count !== 1) throw new Error("申请状态已变化，请刷新");
    await releaseHeldSlot(application.slotId, tx);
    await tx.applicationEvent.create({
      data: { applicationId: id, action: "CANCELLED", note: "信众撤回", actorId: userId },
    });
  });
}

export async function markOrderPaid(
  orderId: string,
  input: { provider: PaymentProviderName; paymentRef: string; actorId?: string | null },
) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { application: true } });
    if (!order) throw new Error("订单不存在");
    if (order.status === "PAID") return;
    if (order.status !== "PENDING_PAYMENT") throw new Error("订单不在待支付状态");
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING_PAYMENT" },
      data: {
        status: "PAID",
        paidAt: new Date(),
        provider: input.provider,
        paymentRef: input.paymentRef,
      },
    });
    if (updated.count !== 1) return;
    if (order.application.slotId) {
      await tx.offeringSlot.updateMany({
        where: { id: order.application.slotId, status: { in: ["HELD", "AVAILABLE"] } },
        data: { status: "OCCUPIED" },
      });
    }
    await tx.applicationEvent.create({
      data: {
        applicationId: order.applicationId,
        action: "PAID",
        note: input.provider === "MOCK" ? "模拟支付成功" : "Stripe 支付成功",
        actorId: input.actorId ?? null,
      },
    });
  });
}

export async function advanceFulfillment(orderId: string, actorId: string, next: "IN_PROGRESS" | "COMPLETED") {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("订单不存在");
    const reason = fulfillmentBlockReason(order.status, order.fulfillment, next);
    if (reason) throw new Error(reason);
    const updated = await tx.order.updateMany({
      where: {
        id: orderId,
        status: "PAID",
        fulfillment: next === "IN_PROGRESS" ? "PENDING" : "IN_PROGRESS",
      },
      data: { fulfillment: next },
    });
    if (updated.count !== 1) throw new Error("履约状态已变化，请刷新");
    await tx.applicationEvent.create({
      data: {
        applicationId: order.applicationId,
        action: next === "IN_PROGRESS" ? "FULFILLMENT_STARTED" : "FULFILLMENT_COMPLETED",
        note: next === "IN_PROGRESS" ? "开始办理" : "办理完成",
        actorId,
      },
    });
  });
}
