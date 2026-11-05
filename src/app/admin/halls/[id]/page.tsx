import { notFound } from "next/navigation";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { firstParam } from "@/lib/http";
import { serviceTypeLabel, serviceTypes } from "@/lib/labels";
import { CURRENCIES } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { deleteHallAction, updateHallAction } from "@/server/actions/halls";

export const metadata = { title: "编辑殿堂" };

export default async function EditHallPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const hall = await prisma.hall.findUnique({
    where: { id },
    include: { services: { orderBy: { sortOrder: "asc" } } },
  });
  if (!hall) notFound();
  const missing = serviceTypes.filter((type) => !hall.services.some((service) => service.type === type));

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl">{hall.name}</h1>
      <div className="mt-4">
        <Flash error={firstParam(query.error)} success={firstParam(query.success)} />
      </div>
      <form action={updateHallAction} className="card mt-4 space-y-4 p-5">
        <input type="hidden" name="id" value={hall.id} />
        <label className="label">
          名称
          <input className="input" name="name" required maxLength={40} defaultValue={hall.name} />
        </label>
        <label className="label">
          标识
          <input className="input" name="slug" required pattern="[a-z0-9-]{2,40}" defaultValue={hall.slug} />
        </label>
        <label className="label">
          简介
          <input className="input" name="summary" required maxLength={120} defaultValue={hall.summary} />
        </label>
        <label className="label">
          介绍
          <textarea className="input min-h-32" name="description" required maxLength={2000} defaultValue={hall.description} />
        </label>
        <label className="label">
          排序
          <input className="input" name="sortOrder" type="number" min={0} max={9999} defaultValue={hall.sortOrder} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked={hall.enabled} />
          对信众开放
        </label>

        <div className="space-y-4 border-t border-line pt-4">
          <h2 className="font-serif text-xl">办理项目</h2>
          {hall.services.map((service) => (
            <fieldset key={service.id} className="rounded-lg border border-line p-3">
              <legend className="px-1 text-sm">{serviceTypeLabel[service.type]}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="label">
                  名称
                  <input className="input" name={`title:${service.id}`} required maxLength={40} defaultValue={service.title} />
                </label>
                <label className="label">
                  价格（元）
                  <input className="input" name={`price:${service.id}`} required defaultValue={(service.priceCents / 100).toFixed(2)} />
                </label>
                <label className="label">
                  币种
                  <select className="input" name={`currency:${service.id}`} defaultValue={service.currency}>
                    {CURRENCIES.map((currency) => (
                      <option key={currency}>{currency}</option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  期限（天，可空）
                  <input className="input" name={`term:${service.id}`} type="number" min={1} max={3650} defaultValue={service.termDays ?? ""} />
                </label>
                <label className="label sm:col-span-2">
                  说明
                  <textarea className="input min-h-20" name={`description:${service.id}`} maxLength={400} defaultValue={service.description} />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name={`enabled:${service.id}`} defaultChecked={service.enabled} />
                  开放办理
                </label>
              </div>
            </fieldset>
          ))}
          {missing.length > 0 ? (
            <fieldset className="rounded-lg border border-dashed border-line p-3">
              <legend className="px-1 text-sm">新增项目</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="label">
                  类型
                  <select className="input" name="newType" defaultValue="">
                    <option value="">不新增</option>
                    {missing.map((type) => (
                      <option key={type} value={type}>
                        {serviceTypeLabel[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  名称
                  <input className="input" name="newTitle" maxLength={40} />
                </label>
                <label className="label">
                  价格（元）
                  <input className="input" name="newPrice" placeholder="留空则用默认价" />
                </label>
                <label className="label">
                  币种
                  <select className="input" name="newCurrency" defaultValue="CNY">
                    {CURRENCIES.map((currency) => (
                      <option key={currency}>{currency}</option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  期限（天）
                  <input className="input" name="newTerm" type="number" min={1} max={3650} />
                </label>
                <label className="label sm:col-span-2">
                  说明
                  <textarea className="input min-h-16" name="newDescription" maxLength={400} />
                </label>
              </div>
            </fieldset>
          ) : null}
        </div>
        <SubmitButton>保存</SubmitButton>
      </form>

      <form action={deleteHallAction} className="mt-6 rounded-xl border border-cinnabar/30 p-4">
        <input type="hidden" name="id" value={hall.id} />
        <p className="text-sm">已有申请的殿堂不能删除，请改为停用。</p>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" name="confirm" value="yes" />
          确认删除此殿堂及其办理项目、空闲位置
        </label>
        <div className="mt-3">
          <SubmitButton className="btn-secondary">删除殿堂</SubmitButton>
        </div>
      </form>
    </div>
  );
}
