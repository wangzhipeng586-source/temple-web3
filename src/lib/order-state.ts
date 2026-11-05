import type { ApplicationStatus, FulfillmentStatus, OrderStatus } from "@prisma/client";

export function reviewBlockReason(status: ApplicationStatus) {
  if (status === "SUBMITTED") return null;
  return "只有待审核的申请可以通过或驳回";
}

export function cancelBlockReason(status: ApplicationStatus) {
  if (status === "SUBMITTED") return null;
  return "仅待审核的申请可以撤回";
}

export function payBlockReason(status: OrderStatus) {
  if (status === "PENDING_PAYMENT") return null;
  if (status === "PAID") return "订单已支付";
  return "订单不在待支付状态";
}

export function fulfillmentBlockReason(
  orderStatus: OrderStatus,
  fulfillment: FulfillmentStatus,
  next: "IN_PROGRESS" | "COMPLETED",
) {
  if (orderStatus !== "PAID") return "未支付的订单不能办理";
  if (next === "IN_PROGRESS" && fulfillment === "PENDING") return null;
  if (next === "COMPLETED" && fulfillment === "IN_PROGRESS") return null;
  return "当前履约状态不可进行该操作";
}
