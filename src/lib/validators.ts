import { z } from "zod";
import { isCurrency } from "@/lib/money";

export const emailSchema = z.string().trim().email("请填写有效邮箱").max(120).transform((value) => value.toLowerCase());

export const passwordSchema = z.string().min(8, "密码至少 8 位").max(72, "密码过长");

export const hallSchema = z.object({
  name: z.string().trim().min(1, "请填写殿堂名称").max(40),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,40}$/, "标识只使用小写字母、数字和短横线"),
  summary: z.string().trim().min(1, "请填写简介").max(120),
  description: z.string().trim().min(1, "请填写介绍").max(2000),
  sortOrder: z.number().int().min(0).max(9999),
});

export const applicationSchema = z.object({
  applicantName: z.string().trim().min(2, "请填写申请人姓名").max(40),
  contact: z.string().trim().min(5, "请填写联系方式").max(80),
  beneficiary: z.string().trim().min(1, "请填写姓名").max(40),
  intention: z.string().trim().min(2, "请填写办理内容").max(500),
  note: z.string().trim().max(300, "备注请少于 300 字").optional(),
});

export const slotSchema = z.object({
  locationCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{1,12}$/, "位置编号只使用字母、数字和短横线"),
  termDays: z.number().int().min(1, "期限至少 1 天").max(3650),
});

export function parseCurrency(value: string) {
  const currency = value.trim().toUpperCase();
  if (!isCurrency(currency)) throw new Error("币种不受支持");
  return currency;
}
