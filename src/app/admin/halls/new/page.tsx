import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { defaultServices } from "@/lib/defaults";
import { firstParam } from "@/lib/http";
import { serviceTypeLabel } from "@/lib/labels";
import { createHallAction } from "@/server/actions/halls";

export const metadata = { title: "新建殿堂" };

export default async function NewHallPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const query = await searchParams;
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl">新建殿堂</h1>
      <div className="mt-4">
        <Flash error={firstParam(query.error)} />
      </div>
      <form action={createHallAction} className="card mt-4 space-y-4 p-5">
        <label className="label">
          名称
          <input className="input" name="name" required maxLength={40} />
        </label>
        <label className="label">
          标识
          <input className="input" name="slug" required pattern="[a-z0-9-]{2,40}" placeholder="例如 daxiong" />
        </label>
        <label className="label">
          简介
          <input className="input" name="summary" required maxLength={120} />
        </label>
        <label className="label">
          介绍
          <textarea className="input min-h-32" name="description" required maxLength={2000} />
        </label>
        <label className="label">
          排序
          <input className="input" name="sortOrder" type="number" min={0} max={9999} defaultValue={0} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked />
          对信众开放
        </label>
        <fieldset>
          <legend className="text-sm font-medium">同时开通的办理项目</legend>
          <div className="mt-2 space-y-2">
            {defaultServices.map((service) => (
              <label key={service.type} className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="service" value={service.type} defaultChecked={service.type === "PRAYER"} />
                <span>
                  {serviceTypeLabel[service.type]}
                  <span className="block text-ink/50">{service.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <SubmitButton>创建</SubmitButton>
      </form>
    </div>
  );
}
