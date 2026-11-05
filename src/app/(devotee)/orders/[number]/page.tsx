import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentUser } from "@/lib/auth";
import { firstParam } from "@/lib/http";
import { displayStatus, eventActionLabel, serviceTypeLabel } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/money";
import { asPriceSnapshot } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { cancelApplicationAction, payOrderAction } from "@/server/actions/applications";

export default async function DevoteeOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ error?: string | string[]; success?: string | string[]; created?: string | string[]; stripe?: string | string[] }>;
}) {
  const { number } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/orders/${number}`)}`);
  const application = await prisma.application.findUnique({
    where: { number },
    include: { order: true, events: { orderBy: { createdAt: "asc" } }, slot: true },
  });
  if (!application || (application.userId !== user.id && user.role !== "ADMIN")) notFound();
  const label = displayStatus(application);
  const snapshot = application.order ? asPriceSnapshot(application.order.priceSnapshot) : null;
  const stripe = firstParam(query.stripe);
  const notice =
    stripe === "success"
      ? "已从支付页返回。到账以 webhook 入账为准；本地演示可使用模拟支付。"
      : stripe === "cancel"
        ? "已取消外部支付。"
        : firstParam(query.created)
          ? "申请已提交，寺院审核通过后即可支付。"
          : undefined;
  const allowMock = process.env.PAYMENT_ALLOW_MOCK !== "false";
  const allowStripe = Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm">
        <Link href="/orders" className="no-underline hover:underline">
          我的申请
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl">{application.number}</h1>
        <StatusBadge label={label} />
      </div>
      <div className="mt-4">
        <Flash error={firstParam(query.error)} success={firstParam(query.success)} notice={notice} />
      </div>
      <dl className="card mt-4 grid gap-3 p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink/50">项目</dt>
          <dd>
            {application.hallName} · {serviceTypeLabel[application.type]}
          </dd>
        </div>
        <div>
          <dt className="text-ink/50">登记费用</dt>
          <dd>{formatMoney(application.priceCents, application.currency)}</dd>
        </div>
        <div>
          <dt className="text-ink/50">申请人</dt>
          <dd>{application.applicantName}</dd>
        </div>
        <div>
          <dt className="text-ink/50">联系方式</dt>
          <dd>{application.contact}</dd>
        </div>
        <div>
          <dt className="text-ink/50">对象 / 姓名</dt>
          <dd>{application.beneficiary}</dd>
        </div>
        <div>
          <dt className="text-ink/50">位置</dt>
          <dd>{application.slot?.locationCode ?? "由寺院安排"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-ink/50">办理内容</dt>
          <dd className="whitespace-pre-wrap">{application.intention}</dd>
        </div>
        {application.note ? (
          <div className="sm:col-span-2">
            <dt className="text-ink/50">备注</dt>
            <dd className="whitespace-pre-wrap">{application.note}</dd>
          </div>
        ) : null}
        {application.reviewNote ? (
          <div className="sm:col-span-2">
            <dt className="text-ink/50">审核说明</dt>
            <dd>{application.reviewNote}</dd>
          </div>
        ) : null}
      </dl>

      {snapshot ? (
        <section className="mt-4 text-sm text-ink/70">
          价目快照：{snapshot.serviceTitle} {formatMoney(snapshot.priceCents, snapshot.currency)}
          {snapshot.termDays ? ` · ${snapshot.termDays} 天` : ""}，记录于 {snapshot.capturedAt ? formatDate(new Date(snapshot.capturedAt)) : ""}
        </section>
      ) : (
        <p className="mt-4 text-sm text-ink/60">寺院审核通过后会生成订单和价目快照。</p>
      )}

      {application.status === "SUBMITTED" ? (
        <form action={cancelApplicationAction} className="mt-6">
          <input type="hidden" name="number" value={application.number} />
          <SubmitButton className="btn-secondary">撤回申请</SubmitButton>
        </form>
      ) : null}

      {application.order?.status === "PENDING_PAYMENT" ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {allowMock ? (
            <form action={payOrderAction}>
              <input type="hidden" name="number" value={application.order.number} />
              <input type="hidden" name="mode" value="mock" />
              <input type="hidden" name="returnTo" value={`/orders/${application.number}`} />
              <SubmitButton>模拟支付成功</SubmitButton>
            </form>
          ) : null}
          {allowStripe ? (
            <form action={payOrderAction}>
              <input type="hidden" name="number" value={application.order.number} />
              <input type="hidden" name="mode" value="stripe" />
              <input type="hidden" name="returnTo" value={`/orders/${application.number}`} />
              <SubmitButton className="btn-secondary">前往 Stripe 支付</SubmitButton>
            </form>
          ) : null}
          {!allowMock && !allowStripe ? <p className="text-sm">支付通道未配置，请联系寺院管理员。</p> : null}
        </div>
      ) : null}

      <h2 className="mt-10 font-serif text-xl">进度</h2>
      <ol className="mt-3 space-y-2 text-sm">
        {application.events.map((event) => (
          <li key={event.id} className="border-l-2 border-line pl-3">
            <span className="text-ink/50">{formatDate(event.createdAt)}</span> {eventActionLabel[event.action] ?? event.action}
            {event.note ? <span className="text-ink/70"> · {event.note}</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
