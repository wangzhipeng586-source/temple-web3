import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { firstParam } from "@/lib/http";
import { displayStatus, eventActionLabel, fulfillmentLabel, orderStatusLabel, serviceTypeLabel } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/money";
import { asPriceSnapshot } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { approveApplicationAction, fulfillmentAction, payOrderAction, rejectApplicationAction } from "@/server/actions/applications";

export default async function AdminOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
}) {
  const { number } = await params;
  const query = await searchParams;
  const application = await prisma.application.findUnique({
    where: { number },
    include: {
      order: true,
      slot: true,
      user: { select: { name: true, email: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!application) notFound();
  const snapshot = application.order ? asPriceSnapshot(application.order.priceSnapshot) : null;
  const allowMock = process.env.PAYMENT_ALLOW_MOCK !== "false";

  return (
    <div className="max-w-3xl">
      <p className="text-sm">
        <Link href="/admin/orders" className="no-underline hover:underline">
          申请单
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl">{application.number}</h1>
        <StatusBadge label={displayStatus(application)} />
      </div>
      <div className="mt-4">
        <Flash error={firstParam(query.error)} success={firstParam(query.success)} />
      </div>
      <dl className="card mt-4 grid gap-3 p-5 text-sm sm:grid-cols-2">
        <Field label="殿堂 / 项目" value={`${application.hallName} · ${serviceTypeLabel[application.type]}`} />
        <Field label="登记费用" value={formatMoney(application.priceCents, application.currency)} />
        <Field label="申请人" value={`${application.applicantName}（${application.user.email}）`} />
        <Field label="联系方式" value={application.contact} />
        <Field label="对象 / 姓名" value={application.beneficiary} />
        <Field label="位置" value={application.slot?.locationCode ?? "由寺院安排"} />
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
      </dl>

      {application.order ? (
        <section className="card mt-4 p-5 text-sm">
          <h2 className="font-serif text-xl">订单 {application.order.number}</h2>
          <p className="mt-2">
            {orderStatusLabel[application.order.status]} · {fulfillmentLabel[application.order.fulfillment]} ·{" "}
            {formatMoney(application.order.amountCents, application.order.currency)}
          </p>
          {snapshot ? (
            <p className="mt-2 text-ink/70">
              价目快照：{snapshot.hallName} / {snapshot.serviceTitle} / {formatMoney(snapshot.priceCents, snapshot.currency)}
              {snapshot.termDays ? ` / ${snapshot.termDays} 天` : ""}
              {snapshot.capturedAt ? ` / ${formatDate(new Date(snapshot.capturedAt))}` : ""}
            </p>
          ) : null}
          {application.order.paymentRef ? <p className="mt-2 text-ink/60">支付参考：{application.order.paymentRef}</p> : null}
        </section>
      ) : null}

      {application.status === "SUBMITTED" ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <form action={approveApplicationAction} className="card p-4">
            <input type="hidden" name="number" value={application.number} />
            <p className="text-sm">通过后按当前价目生成待支付订单。</p>
            <div className="mt-3">
              <SubmitButton>审核通过</SubmitButton>
            </div>
          </form>
          <form action={rejectApplicationAction} className="card space-y-3 p-4">
            <input type="hidden" name="number" value={application.number} />
            <label className="label">
              驳回说明
              <textarea className="input min-h-20" name="reviewNote" maxLength={300} />
            </label>
            <SubmitButton className="btn-secondary">驳回</SubmitButton>
          </form>
        </div>
      ) : null}

      {application.order?.status === "PENDING_PAYMENT" && allowMock ? (
        <form action={payOrderAction} className="mt-4">
          <input type="hidden" name="number" value={application.order.number} />
          <input type="hidden" name="mode" value="mock" />
          <input type="hidden" name="returnTo" value={`/admin/orders/${application.number}`} />
          <SubmitButton>模拟支付成功</SubmitButton>
        </form>
      ) : null}

      {application.order?.status === "PAID" && application.order.fulfillment === "PENDING" ? (
        <form action={fulfillmentAction} className="mt-4">
          <input type="hidden" name="number" value={application.number} />
          <input type="hidden" name="next" value="IN_PROGRESS" />
          <SubmitButton>开始办理</SubmitButton>
        </form>
      ) : null}
      {application.order?.status === "PAID" && application.order.fulfillment === "IN_PROGRESS" ? (
        <form action={fulfillmentAction} className="mt-4">
          <input type="hidden" name="number" value={application.number} />
          <input type="hidden" name="next" value="COMPLETED" />
          <SubmitButton>办理完成</SubmitButton>
        </form>
      ) : null}

      <h2 className="mt-8 font-serif text-xl">记录</h2>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink/50">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
