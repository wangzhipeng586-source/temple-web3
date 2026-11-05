import type { ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function loadTempleWithHalls() {
  return prisma.temple.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      halls: {
        where: { enabled: true },
        orderBy: { sortOrder: "asc" },
        include: {
          services: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
}

export async function loadHallService(slug: string, type: ServiceType) {
  const hall = await prisma.hall.findFirst({
    where: { slug, enabled: true },
    include: {
      temple: true,
      services: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!hall) return null;
  const service = hall.services.find((item) => item.type === type && item.enabled);
  if (!service) return null;
  const slots =
    type === "PRAYER"
      ? []
      : await prisma.offeringSlot.findMany({
          where: { hallId: hall.id, type, status: "AVAILABLE" },
          orderBy: { locationCode: "asc" },
        });
  return { hall, service, slots };
}
