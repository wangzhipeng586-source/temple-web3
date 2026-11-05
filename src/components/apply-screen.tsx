import Link from "next/link";
import { notFound } from "next/navigation";
import type { ServiceType } from "@prisma/client";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentUser } from "@/lib/auth";
import { loadHallService } from "@/lib/halls";
import { applicationFieldCopy, servicePath, serviceTypeLabel } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { createApplicationAction } from "@/server/actions/applications";

export async function ApplyScreen({
  slug,
  type,
  error,
}: {
  slug: string;
  type: ServiceType;
  error?: string;
}) {
  const data = await loadHallService(slug, type);
  if (!data) notFound();
  const user = await getCurrentUser();
  const copy = applicationFieldCopy(type);
  const returnTo = servicePath(slug, type);
  const { hall, service, slots } = data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-ink/60">
        <Link href="/halls" className="no-underline hover:underline">
          殿堂
        </Link>
        <span className="px-1">/</span>
        <Link href={`/halls/${hall.slug}`} className="no-underline hover:underline">
          {hall.name}
        </Link>
      </p>
      <h1 className="mt-3 font-serif text-3xl">
        {hall.name} · {serviceTypeLabel[type]}
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink/75">{service.description}</p>
      <p className="mt-2 text-sm text-ink/60">{copy.hint}</p>
      <p className="mt-4 text-lg">
        登记费用 <span className="font-medium">{formatMoney(service.priceCents, service.currency)}</span>
        {service.termDays ? <span className="ml-2 text-sm text-ink/60">期限 {service.termDays} 天</span> : null}
      </p>
      <p className="mt-2 text-xs leading-5 text-ink/50">费用在审核通过后支付。本页不承诺宗教效验。</p>

      <div className="mt-6">
        <Flash error={error} />
      </div>

      {user ? (
        <form action={createApplicationAction} className="card mt-4 space-y-4 p-5">
          <input type="hidden" name="hallSlug" value={hall.slug} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="label">
            申请人姓名
            <input className="input" name="applicantName" required minLength={2} maxLength={40} defaultValue={user.name ?? ""} />
          </label>
          <label className="label">
            联系方式
            <input className="input" name="contact" required minLength={5} maxLength={80} placeholder="手机或邮箱" defaultValue={user.email} />
          </label>
          <label className="label">
            {copy.beneficiary}
            <input className="input" name="beneficiary" required maxLength={40} />
          </label>
          <label className="label">
            {copy.intention}
            <textarea className="input min-h-28" name="intention" required minLength={2} maxLength={500} />
          </label>
          {slots.length > 0 ? (
            <label className="label">
              位置（可选）
              <select className="input" name="slotId" defaultValue="">
                <option value="">由寺院安排</option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.locationCode} · {slot.termDays} 天
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="label">
            备注
            <textarea className="input min-h-20" name="note" maxLength={300} />
          </label>
          <SubmitButton>提交申请</SubmitButton>
        </form>
      ) : (
        <div className="card mt-6 p-5 text-sm leading-6">
          <p>登录后即可提交。还没有账号可以先注册。</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="btn-primary no-underline" href={`/login?next=${encodeURIComponent(returnTo)}`}>
              登录
            </Link>
            <Link className="btn-secondary no-underline" href={`/register?next=${encodeURIComponent(returnTo)}`}>
              注册
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
