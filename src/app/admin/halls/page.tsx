import Link from "next/link";
import { Flash } from "@/components/flash";
import { firstParam } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "殿堂管理" };

export default async function AdminHallsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string | string[]; error?: string | string[] }>;
}) {
  const query = await searchParams;
  const halls = await prisma.hall.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { services: true, applications: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">殿堂</h1>
        <Link href="/admin/halls/new" className="btn-primary no-underline">
          新建殿堂
        </Link>
      </div>
      <div className="mt-4">
        <Flash error={firstParam(query.error)} success={firstParam(query.success)} />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-ink/50">
            <tr>
              <th className="py-2 font-medium">名称</th>
              <th className="py-2 font-medium">标识</th>
              <th className="py-2 font-medium">项目</th>
              <th className="py-2 font-medium">申请</th>
              <th className="py-2 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {halls.map((hall) => (
              <tr key={hall.id} className="border-t border-line">
                <td className="py-3">
                  <Link href={`/admin/halls/${hall.id}`} className="text-cinnabar no-underline hover:underline">
                    {hall.name}
                  </Link>
                </td>
                <td className="py-3">{hall.slug}</td>
                <td className="py-3">{hall._count.services}</td>
                <td className="py-3">{hall._count.applications}</td>
                <td className="py-3">{hall.enabled ? "开放" : "停用"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
