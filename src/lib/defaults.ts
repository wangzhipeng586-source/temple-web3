import type { ServiceType } from "@prisma/client";

export const defaultServices: Array<{
  type: ServiceType;
  title: string;
  description: string;
  priceCents: number;
  termDays: number | null;
}> = [
  {
    type: "PRAYER",
    title: "祈福",
    description: "登记祈福对象与意向，由寺院审核后办理。",
    priceCents: 6800,
    termDays: null,
  },
  {
    type: "LAMP",
    title: "点灯",
    description: "登记灯位与期限。未选择位置时由寺院安排。",
    priceCents: 3600,
    termDays: 30,
  },
  {
    type: "AUSPICIOUS_TABLET",
    title: "吉祥牌位",
    description: "为在世亲眷登记吉祥牌位文字。",
    priceCents: 12800,
    termDays: 365,
  },
  {
    type: "MEMORIAL_TABLET",
    title: "往生牌位",
    description: "登记往生者姓名与牌位文字。不承诺宗教效验。",
    priceCents: 12800,
    termDays: 365,
  },
];
