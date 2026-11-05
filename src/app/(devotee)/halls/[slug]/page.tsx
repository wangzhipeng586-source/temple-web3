import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { servicePath, serviceTypeLabel } from "@/lib/labels";
import { formatMoney } from "@/lib/money";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hall = await prisma.hall.findFirst({ where: { slug, enabled: true } });
  return { title: hall?.name ?? "殿堂" };
}

export default async function HallDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hall = await prisma.hall.findFirst({
    where: { slug, enabled: true },
    include: {
      temple: true,
      services: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!hall) notFound();
  const slotGroups = await prisma.offeringSlot.groupBy({
    by: ["type"],
    where: { hallId: hall.id, status: "AVAILABLE" },
    _count: true,
  });
  const available = new Map(slotGroups.map((group) => [group.type, group._count]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-ink/60">
        <Link href="/halls" className="no-underline hover:underline">
          殿堂
        </Link>
        <span className="px-1">/</span>
        {hall.temple.name}
      </p>
      <h1 className="mt-3 font-serif text-4xl">{hall.name}</h1>
      <p className="mt-3 text-base leading-7 text-ink/80">{hall.summary}</p>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink/75">{hall.description}</p>

      <h2 className="mt-10 font-serif text-2xl">可办理项目</h2>
      <div className="mt-4 space-y-3">
        {hall.services.map((service) => (
          <article key={service.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg">{service.title}</h3>
              <p className="mt-1 text-sm leading-6 text-ink/70">{service.description}</p>
              <p className="mt-2 text-sm">
                {formatMoney(service.priceCents, service.currency)}
                {service.termDays ? ` · ${service.termDays} 天` : ""}
                {service.type !== "PRAYER" ? ` · 空闲位置 ${available.get(service.type) ?? 0}` : ""}
              </p>
            </div>
            <Link href={servicePath(hall.slug, service.type)} className="btn-primary shrink-0 no-underline">
              前往办理
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
