import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { displayStatus, serviceTypeLabel } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "我的申请" };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/orders");
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: { order: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-serif text-3xl">我的申请</h1>
      <p className="mt-2 text-sm text-ink/70">显示最近 50 条。审核通过后可在详情页支付。</p>
      {applications.length === 0 ? (
        <div className="card mt-6 p-6 text-sm">
          还没有申请。可以从<Link href="/halls">殿堂</Link>进入祈福、点灯或牌位。
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-ink/50">
              <tr>
                <th className="py-2 font-medium">单号</th>
                <th className="py-2 font-medium">项目</th>
                <th className="py-2 font-medium">殿堂</th>
                <th className="py-2 font-medium">金额</th>
                <th className="py-2 font-medium">状态</th>
                <th className="py-2 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => {
                const label = displayStatus(application);
                return (
                  <tr key={application.id} className="border-t border-line">
                    <td className="py-3">
                      <Link href={`/orders/${application.number}`} className="text-cinnabar no-underline hover:underline">
                        {application.number}
                      </Link>
                    </td>
                    <td className="py-3">{serviceTypeLabel[application.type]}</td>
                    <td className="py-3">{application.hallName}</td>
                    <td className="py-3">{formatMoney(application.priceCents, application.currency)}</td>
                    <td className="py-3">
                      <StatusBadge label={label} />
                    </td>
                    <td className="py-3">{formatDate(application.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
