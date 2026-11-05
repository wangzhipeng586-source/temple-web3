"use server";

import { redirect } from "next/navigation";
import type { ServiceType } from "@prisma/client";
import { requireAdmin, requireUser } from "@/lib/auth";
import { publicError, rethrowNext } from "@/lib/errors";
import { readString, safeNext } from "@/lib/http";
import { parseServiceType } from "@/lib/labels";
import {
  advanceFulfillment,
  approveApplication,
  cancelApplication,
  markOrderPaid,
  rejectApplication,
  submitApplication,
} from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { createStripeCheckout } from "@/lib/stripe";
import { applicationSchema } from "@/lib/validators";

export async function createApplicationAction(formData: FormData) {
  const returnTo = safeNext(readString(formData, "returnTo"), "/halls");
  const user = await requireUser(returnTo);
  const type = parseServiceType(readString(formData, "type"));
  try {
    if (!type) throw new Error("办理类型不正确");
    const parsed = applicationSchema.parse({
      applicantName: readString(formData, "applicantName"),
      contact: readString(formData, "contact"),
      beneficiary: readString(formData, "beneficiary"),
      intention: readString(formData, "intention"),
      note: readString(formData, "note") || undefined,
    });
    const application = await submitApplication({
      userId: user.id,
      hallSlug: readString(formData, "hallSlug"),
      type: type satisfies ServiceType,
      slotId: readString(formData, "slotId") || null,
      ...parsed,
    });
    redirect(`/orders/${application.number}?created=1`);
  } catch (error) {
    rethrowNext(error);
    redirect(`${returnTo}?error=${encodeURIComponent(publicError(error))}`);
  }
}

export async function cancelApplicationAction(formData: FormData) {
  const number = readString(formData, "number");
  const user = await requireUser(`/orders/${number}`);
  try {
    const application = await prisma.application.findUnique({ where: { number } });
    if (!application) throw new Error("申请不存在");
    await cancelApplication(application.id, user.id);
  } catch (error) {
    rethrowNext(error);
    redirect(`/orders/${number}?error=${encodeURIComponent(publicError(error))}`);
  }
  redirect(`/orders/${number}?success=${encodeURIComponent("申请已撤回")}`);
}

export async function approveApplicationAction(formData: FormData) {
  const admin = await requireAdmin();
  const number = readString(formData, "number");
  try {
    const application = await prisma.application.findUnique({ where: { number } });
    if (!application) throw new Error("申请不存在");
    await approveApplication(application.id, admin.id);
  } catch (error) {
    rethrowNext(error);
    redirect(`/admin/orders/${number}?error=${encodeURIComponent(publicError(error))}`);
  }
  redirect(`/admin/orders/${number}?success=${encodeURIComponent("已审核通过，等待支付")}`);
}

export async function rejectApplicationAction(formData: FormData) {
  const admin = await requireAdmin();
  const number = readString(formData, "number");
  try {
    const application = await prisma.application.findUnique({ where: { number } });
    if (!application) throw new Error("申请不存在");
    const note = readString(formData, "reviewNote");
    if (note.length > 300) throw new Error("驳回说明请少于 300 字");
    await rejectApplication(application.id, admin.id, note);
  } catch (error) {
    rethrowNext(error);
    redirect(`/admin/orders/${number}?error=${encodeURIComponent(publicError(error))}`);
  }
  redirect(`/admin/orders/${number}?success=${encodeURIComponent("已驳回")}`);
}

export async function payOrderAction(formData: FormData) {
  const number = readString(formData, "number");
  const returnTo = safeNext(readString(formData, "returnTo"), `/orders/${number}`);
  const user = await requireUser(returnTo);
  try {
    const order = await prisma.order.findUnique({ where: { number }, include: { application: true } });
    if (!order) throw new Error("订单不存在");
    const isOwner = order.application.userId === user.id;
    const isAdmin = user.role === "ADMIN";
    if (!isOwner && !isAdmin) throw new Error("无权支付该订单");
    const mode = readString(formData, "mode");
    if (mode === "stripe") {
      if (!isOwner) throw new Error("请由申请人前往支付");
      const session = await createStripeCheckout({
        id: order.id,
        number: order.application.number,
        amountCents: order.amountCents,
        currency: order.currency,
        title: `${order.application.hallName} · ${order.application.serviceTitle}`,
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { provider: "STRIPE", paymentRef: session.id },
      });
      redirect(session.url);
    }
    if (process.env.PAYMENT_ALLOW_MOCK === "false") throw new Error("模拟支付已关闭");
    await markOrderPaid(order.id, { provider: "MOCK", paymentRef: `mock_${Date.now()}`, actorId: user.id });
  } catch (error) {
    rethrowNext(error);
    redirect(`${returnTo}?error=${encodeURIComponent(publicError(error))}`);
  }
  redirect(`${returnTo}?success=${encodeURIComponent("模拟支付成功")}`);
}

export async function fulfillmentAction(formData: FormData) {
  const admin = await requireAdmin();
  const number = readString(formData, "number");
  const next = readString(formData, "next");
  try {
    if (next !== "IN_PROGRESS" && next !== "COMPLETED") throw new Error("履约动作不正确");
    const order = await prisma.order.findFirst({ where: { application: { number } } });
    if (!order) throw new Error("订单不存在");
    await advanceFulfillment(order.id, admin.id, next);
  } catch (error) {
    rethrowNext(error);
    redirect(`/admin/orders/${number}?error=${encodeURIComponent(publicError(error))}`);
  }
  redirect(`/admin/orders/${number}?success=${encodeURIComponent(next === "IN_PROGRESS" ? "已开始办理" : "办理已完成")}`);
}
