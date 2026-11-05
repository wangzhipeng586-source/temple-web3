import Link from "next/link";
import type { ApplicationStatus, ServiceType } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { firstParam } from "@/lib/http";
import { applicationStatusLabel, displayStatus, parseServiceType, serviceTypeLabel } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "申请单" };

const statuses: ApplicationStatus[] = ["SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; type?: string | string[] }>;
}) {
  const query = await searchParams;
  const status = statuses.find((item) => item === firstParam(query.status));
  const type = parseServiceType(firstParam(query.type));
  const applications = await prisma.application.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    },
    include: { order: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">申请单</h1>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Filter href="/admin/orders" active={!status && !type}>
          全部
        </Filter>
        {statuses.map((item) => (
          <Filter key={item} href={`/admin/orders?status=${item}`} active={status === item}>
            {applicationStatusLabel[item]}
          </Filter>
        ))}
        {(["PRAYER", "LAMP", "AUSPICIOUS_TABLET", "MEMORIAL_TABLET"] as ServiceType[]).map((item) => (
          <Filter key={item} href={`/admin/orders?type=${item}`} active={type === item}>
            {serviceTypeLabel[item]}
          </Filter>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-ink/50">
            <tr>
              <th className="py-2 font-medium">单号</th>
              <th className="py-2 font-medium">项目</th>
              <th className="py-2 font-medium">申请人</th>
              <th className="py-2 font-medium">对象</th>
              <th className="py-2 font-medium">金额</th>
              <th className="py-2 font-medium">状态</th>
              <th className="py-2 font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-ink/60">
                  没有符合条件的申请。
                </td>
              </tr>
            ) : null}
            {applications.map((application) => (
              <tr key={application.id} className="border-t border-line">
                <td className="py-3">
                  <Link href={`/admin/orders/${application.number}`} className="text-cinnabar no-underline hover:underline">
                    {application.number}
                  </Link>
                </td>
                <td className="py-3">
                  {application.hallName} · {serviceTypeLabel[application.type]}
                </td>
                <td className="py-3">{application.applicantName}</td>
                <td className="py-3">{application.beneficiary}</td>
                <td className="py-3">{formatMoney(application.priceCents, application.currency)}</td>
                <td className="py-3">
                  <StatusBadge label={displayStatus(application)} />
                </td>
                <td className="py-3">{formatDate(application.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Filter({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 no-underline ${active ? "bg-pine text-white" : "border border-line bg-white text-ink"}`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
