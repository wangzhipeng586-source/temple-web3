import type { ApplicationStatus, FulfillmentStatus, OrderStatus, ServiceType, SlotStatus } from "@prisma/client";

export const serviceTypes = ["PRAYER", "LAMP", "AUSPICIOUS_TABLET", "MEMORIAL_TABLET"] as const;

export const serviceTypeLabel: Record<ServiceType, string> = {
  PRAYER: "祈福",
  LAMP: "点灯",
  AUSPICIOUS_TABLET: "吉祥牌位",
  MEMORIAL_TABLET: "往生牌位",
};

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
  SUBMITTED: "待审核",
  APPROVED: "已通过",
  REJECTED: "已驳回",
  CANCELLED: "已撤回",
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "待支付",
  PAID: "已支付",
  CANCELLED: "已取消",
};

export const fulfillmentLabel: Record<FulfillmentStatus, string> = {
  PENDING: "待办理",
  IN_PROGRESS: "办理中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

export const slotStatusLabel: Record<SlotStatus, string> = {
  AVAILABLE: "空闲",
  HELD: "已预留",
  OCCUPIED: "已占用",
};

export const eventActionLabel: Record<string, string> = {
  SUBMITTED: "提交申请",
  APPROVED: "审核通过",
  REJECTED: "驳回",
  CANCELLED: "撤回",
  PAID: "支付",
  FULFILLMENT_STARTED: "开始办理",
  FULFILLMENT_COMPLETED: "办理完成",
};

export function parseServiceType(value: string | undefined): ServiceType | undefined {
  return serviceTypes.includes(value as ServiceType) ? (value as ServiceType) : undefined;
}

export function servicePath(hallSlug: string, type: ServiceType) {
  switch (type) {
    case "PRAYER":
      return `/halls/${hallSlug}/pray`;
    case "LAMP":
      return `/halls/${hallSlug}/lamp`;
    case "AUSPICIOUS_TABLET":
      return `/halls/${hallSlug}/tablet/auspicious`;
    case "MEMORIAL_TABLET":
      return `/halls/${hallSlug}/tablet/memorial`;
  }
}

export function applicationFieldCopy(type: ServiceType) {
  switch (type) {
    case "PRAYER":
      return {
        beneficiary: "祈福对象",
        intention: "祈福意向",
        hint: "请填写希望寺院登记的祈福对象与内容。提交后需寺院审核。",
      };
    case "LAMP":
      return {
        beneficiary: "点灯人 / 回向对象",
        intention: "点灯说明",
        hint: "可选择空闲灯位与期限。不选位置时由寺院安排。",
      };
    case "AUSPICIOUS_TABLET":
      return {
        beneficiary: "阳上姓名",
        intention: "牌位文字",
        hint: "吉祥牌位用于在世亲眷。请填写拟写入牌位的姓名与文字。",
      };
    case "MEMORIAL_TABLET":
      return {
        beneficiary: "往生者姓名",
        intention: "牌位文字",
        hint: "请填写往生者姓名与牌位文字。本站不承诺超度或宗教效验。",
      };
  }
}

export function displayStatus(input: {
  status: ApplicationStatus;
  order?: { status: OrderStatus; fulfillment: FulfillmentStatus } | null;
}) {
  if (input.status === "SUBMITTED") return "待审核";
  if (input.status === "REJECTED") return "已驳回";
  if (input.status === "CANCELLED") return "已撤回";
  if (!input.order) return "已通过";
  if (input.order.status === "PENDING_PAYMENT") return "待支付";
  if (input.order.status === "CANCELLED") return "订单已取消";
  if (input.order.fulfillment === "IN_PROGRESS") return "办理中";
  if (input.order.fulfillment === "COMPLETED") return "已完成";
  return "已支付";
}

export function statusTone(label: string) {
  switch (label) {
    case "待审核":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    case "待支付":
      return "bg-orange-50 text-orange-900 ring-orange-200";
    case "办理中":
    case "已支付":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200";
    case "已完成":
      return "bg-pine/10 text-pine ring-pine/20";
    case "已驳回":
      return "bg-cinnabar/10 text-cinnabar ring-cinnabar/20";
    default:
      return "bg-black/5 text-ink/70 ring-black/10";
  }
}

export function numberPrefix(type: ServiceType) {
  switch (type) {
    case "PRAYER":
      return "QF";
    case "LAMP":
      return "DD";
    case "AUSPICIOUS_TABLET":
      return "JX";
    case "MEMORIAL_TABLET":
      return "WS";
  }
}
