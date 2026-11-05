"use server";

import { redirect } from "next/navigation";
import { Prisma, type ServiceType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { defaultServices } from "@/lib/defaults";
import { publicError } from "@/lib/errors";
import { readString } from "@/lib/http";
import { yuanToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { hallSchema, parseCurrency } from "@/lib/validators";
import { parseServiceType } from "@/lib/labels";

function formError(path: string, error: unknown) {
  redirect(`${path}?error=${encodeURIComponent(publicError(error))}`);
}

export async function createHallAction(formData: FormData) {
  await requireAdmin();
  let hallId = "";
  try {
    const parsed = hallSchema.parse({
      name: readString(formData, "name"),
      slug: readString(formData, "slug").toLowerCase(),
      summary: readString(formData, "summary"),
      description: readString(formData, "description"),
      sortOrder: Number(readString(formData, "sortOrder") || "0"),
    });
    const temple = await prisma.temple.findFirst({ orderBy: { createdAt: "asc" } });
    if (!temple) throw new Error("尚未初始化寺院，请先运行种子数据");
    const hall = await prisma.hall.create({
      data: {
        templeId: temple.id,
        ...parsed,
        enabled: formData.get("enabled") === "on",
      },
    });
    hallId = hall.id;
    const selected = new Set(formData.getAll("service").map(String));
    const services = defaultServices.filter((service) => selected.has(service.type));
    if (services.length > 0) {
      await prisma.hallService.createMany({
        data: services.map((service, index) => ({
          hallId: hall.id,
          type: service.type,
          title: service.title,
          description: service.description,
          priceCents: service.priceCents,
          currency: "CNY",
          termDays: service.termDays,
          enabled: true,
          sortOrder: index + 1,
        })),
      });
    }
  } catch (error) {
    const message =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
        ? "殿堂标识已存在"
        : publicError(error);
    redirect(`/admin/halls/new?error=${encodeURIComponent(message)}`);
  }
  redirect(`/admin/halls/${hallId}?success=${encodeURIComponent("殿堂已创建")}`);
}

export async function updateHallAction(formData: FormData) {
  await requireAdmin();
  const id = readString(formData, "id");
  try {
    const parsed = hallSchema.parse({
      name: readString(formData, "name"),
      slug: readString(formData, "slug").toLowerCase(),
      summary: readString(formData, "summary"),
      description: readString(formData, "description"),
      sortOrder: Number(readString(formData, "sortOrder") || "0"),
    });
    await prisma.$transaction(async (tx) => {
      await tx.hall.update({
        where: { id },
        data: { ...parsed, enabled: formData.get("enabled") === "on" },
      });
      const services = await tx.hallService.findMany({ where: { hallId: id } });
      for (const service of services) {
        const title = readString(formData, `title:${service.id}`);
        const description = readString(formData, `description:${service.id}`);
        if (title.length < 1 || title.length > 40) throw new Error("项目名称请在 1 到 40 字之间");
        if (description.length > 400) throw new Error("项目说明请少于 400 字");
        const termRaw = readString(formData, `term:${service.id}`);
        const termDays = termRaw === "" ? null : Number(termRaw);
        if (termDays !== null && (!Number.isInteger(termDays) || termDays < 1 || termDays > 3650)) {
          throw new Error("期限须为 1 到 3650 天，或留空");
        }
        await tx.hallService.update({
          where: { id: service.id },
          data: {
            title,
            description,
            priceCents: yuanToCents(readString(formData, `price:${service.id}`)),
            currency: parseCurrency(readString(formData, `currency:${service.id}`) || service.currency),
            termDays,
            enabled: formData.get(`enabled:${service.id}`) === "on",
          },
        });
      }
      const newType = parseServiceType(readString(formData, "newType"));
      if (newType && !services.some((service) => service.type === newType)) {
        const preset = defaultServices.find((service) => service.type === newType);
        const title = readString(formData, "newTitle") || preset?.title || "未命名项目";
        const description = readString(formData, "newDescription") || preset?.description || "";
        if (title.length > 40 || description.length > 400) throw new Error("新项目名称或说明过长");
        const newTermRaw = readString(formData, "newTerm");
        let termDays = preset?.termDays ?? null;
        if (newTermRaw) {
          const parsedTerm = Number(newTermRaw);
          if (!Number.isInteger(parsedTerm) || parsedTerm < 1 || parsedTerm > 3650) {
            throw new Error("期限须为 1 到 3650 天，或留空");
          }
          termDays = parsedTerm;
        }
        await tx.hallService.create({
          data: {
            hallId: id,
            type: newType,
            title,
            description,
            priceCents: yuanToCents(readString(formData, "newPrice") || String((preset?.priceCents ?? 0) / 100)),
            currency: parseCurrency(readString(formData, "newCurrency") || "CNY"),
            termDays,
            enabled: true,
            sortOrder: services.length + 1,
          },
        });
      }
    });
  } catch (error) {
    const message =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
        ? "殿堂标识或项目类型已存在"
        : publicError(error);
    formError(`/admin/halls/${id}`, new Error(message));
  }
  redirect(`/admin/halls/${id}?success=${encodeURIComponent("殿堂已保存")}`);
}

export async function deleteHallAction(formData: FormData) {
  await requireAdmin();
  const id = readString(formData, "id");
  if (readString(formData, "confirm") !== "yes") {
    formError(`/admin/halls/${id}`, new Error("删除前请勾选确认"));
  }
  try {
    const count = await prisma.application.count({ where: { hallId: id } });
    if (count > 0) throw new Error("已有申请的殿堂不能删除，请改为停用");
    await prisma.hall.delete({ where: { id } });
  } catch (error) {
    formError(`/admin/halls/${id}`, error);
  }
  redirect(`/admin/halls?success=${encodeURIComponent("殿堂已删除")}`);
}

export async function createSlotAction(formData: FormData) {
  await requireAdmin();
  const hallId = readString(formData, "hallId");
  const type = parseServiceType(readString(formData, "type"));
  try {
    if (!hallId || !type || type === "PRAYER") throw new Error("请选择殿堂和位置类型");
    const locationCode = readString(formData, "locationCode").toUpperCase();
    const termDays = Number(readString(formData, "termDays"));
    if (!/^[A-Z0-9-]{1,12}$/.test(locationCode)) throw new Error("位置编号只使用字母、数字和短横线");
    if (!Number.isInteger(termDays) || termDays < 1 || termDays > 3650) throw new Error("期限须为 1 到 3650 天");
    await prisma.offeringSlot.create({
      data: { hallId, type: type satisfies ServiceType, locationCode, termDays, status: "AVAILABLE" },
    });
  } catch (error) {
    const message =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
        ? "该位置已存在"
        : publicError(error);
    redirect(`/admin/inventory?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/inventory?success=" + encodeURIComponent("位置已添加"));
}

export async function deleteSlotAction(formData: FormData) {
  await requireAdmin();
  const id = readString(formData, "id");
  try {
    const slot = await prisma.offeringSlot.findUnique({ where: { id }, include: { _count: { select: { applications: true } } } });
    if (!slot) throw new Error("位置不存在");
    if (slot.status !== "AVAILABLE" || slot._count.applications > 0) {
      throw new Error("仅可删除空闲且无申请记录的位置");
    }
    await prisma.offeringSlot.delete({ where: { id } });
  } catch (error) {
    redirect(`/admin/inventory?error=${encodeURIComponent(publicError(error))}`);
  }
  redirect("/admin/inventory?success=" + encodeURIComponent("位置已删除"));
}
