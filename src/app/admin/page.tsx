import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { displayStatus, serviceTypeLabel } from "@/lib/labels";
import { formatDate } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "管理概览" };

export default async function AdminHomePage() {
  const [temple, hallCount, pendingCount, paidCount, recent] = await Promise.all([
    prisma.temple.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.hall.count(),
    prisma.application.count({ where: { status: "SUBMITTED" } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.application.findMany({
      include: { order: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const stats = [
    { label: "殿堂", value: hallCount, href: "/admin/halls" },
    { label: "待审核", value: pendingCount, href: "/admin/orders?status=SUBMITTED" },
    { label: "已支付订单", value: paidCount, href: "/admin/orders" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl">{temple?.name ?? "云寺院"}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">{temple?.description}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card p-4 no-underline">
            <p className="text-sm text-ink/60">{stat.label}</p>
            <p className="mt-1 font-serif text-3xl text-ink">{stat.value}</p>
          </Link>
        ))}
      </div>
      <h2 className="mt-8 font-serif text-xl">最近申请</h2>
      <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-card">
        {recent.length === 0 ? <li className="p-4 text-sm text-ink/60">还没有申请。</li> : null}
        {recent.map((application) => (
          <li key={application.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <Link href={`/admin/orders/${application.number}`} className="text-cinnabar no-underline hover:underline">
              {application.number}
            </Link>
            <span>
              {application.hallName} · {serviceTypeLabel[application.type]} · {application.applicantName}
            </span>
            <StatusBadge label={displayStatus(application)} />
            <span className="text-ink/50">{formatDate(application.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
