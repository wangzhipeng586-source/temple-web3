import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { firstParam } from "@/lib/http";
import { serviceTypeLabel, slotStatusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { createSlotAction, deleteSlotAction } from "@/server/actions/halls";

export const metadata = { title: "位置库存" };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
}) {
  const query = await searchParams;
  const [halls, slots] = await Promise.all([
    prisma.hall.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.offeringSlot.findMany({
      include: { hall: true },
      orderBy: [{ hall: { sortOrder: "asc" } }, { type: "asc" }, { locationCode: "asc" }],
    }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl">位置库存</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
        灯位与牌位按位置和期限管理。信众选择后预留，支付成功后占用，驳回或撤回后释放。祈福不占位置。
      </p>
      <div className="mt-4">
        <Flash error={firstParam(query.error)} success={firstParam(query.success)} />
      </div>
      <form action={createSlotAction} className="card mt-4 grid gap-3 p-4 sm:grid-cols-5">
        <label className="label sm:col-span-2">
          殿堂
          <select className="input" name="hallId" required defaultValue={halls[0]?.id}>
            {halls.map((hall) => (
              <option key={hall.id} value={hall.id}>
                {hall.name}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          类型
          <select className="input" name="type" defaultValue="LAMP">
            <option value="LAMP">点灯</option>
            <option value="AUSPICIOUS_TABLET">吉祥牌位</option>
            <option value="MEMORIAL_TABLET">往生牌位</option>
          </select>
        </label>
        <label className="label">
          编号
          <input className="input" name="locationCode" required placeholder="L-09" />
        </label>
        <label className="label">
          期限（天）
          <input className="input" name="termDays" type="number" min={1} max={3650} required defaultValue={30} />
        </label>
        <div className="sm:col-span-5">
          <SubmitButton>添加位置</SubmitButton>
        </div>
      </form>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-ink/50">
            <tr>
              <th className="py-2 font-medium">殿堂</th>
              <th className="py-2 font-medium">类型</th>
              <th className="py-2 font-medium">位置</th>
              <th className="py-2 font-medium">期限</th>
              <th className="py-2 font-medium">状态</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id} className="border-t border-line">
                <td className="py-3">{slot.hall.name}</td>
                <td className="py-3">{serviceTypeLabel[slot.type]}</td>
                <td className="py-3">{slot.locationCode}</td>
                <td className="py-3">{slot.termDays} 天</td>
                <td className="py-3">{slotStatusLabel[slot.status]}</td>
                <td className="py-3 text-right">
                  {slot.status === "AVAILABLE" ? (
                    <form action={deleteSlotAction}>
                      <input type="hidden" name="id" value={slot.id} />
                      <button type="submit" className="text-cinnabar">
                        删除
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
