import Link from "next/link";
import { Flash } from "@/components/flash";
import { getCurrentUser } from "@/lib/auth";
import { loadTempleWithHalls } from "@/lib/halls";
import { servicePath, serviceTypeLabel } from "@/lib/labels";
import { firstParam } from "@/lib/http";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string | string[] }>;
}) {
  const params = await searchParams;
  const temple = await loadTempleWithHalls();
  const user = await getCurrentUser();
  const notice = firstParam(params.notice) === "admin" ? "当前账号不是管理员。" : undefined;

  return (
    <div>
      <section className="border-b border-line bg-[radial-gradient(ellipse_at_top,_#fffaf2,_#f3efe4)]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <p className="text-sm tracking-[0.18em] text-gold">单寺院 · 事务办理</p>
          <h1 className="mt-3 font-serif text-4xl text-ink sm:text-5xl">{temple?.name ?? "云寺院"}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/80">
            {temple?.summary ?? "数据库里还没有寺院。请先运行 npm run db:setup。"}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/60">
            本平台只做寺院事务登记与办理记录，供信众查阅进度。不宣传、不承诺任何宗教效验或感应结果。
          </p>
          {notice ? (
            <div className="mt-6 max-w-xl">
              <Flash notice={notice} />
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/halls" className="btn-primary no-underline">
              进入殿堂
            </Link>
            {user ? null : (
              <Link href="/register" className="btn-secondary no-underline">
                注册信众账号
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-10 sm:grid-cols-2">
        {temple?.halls.map((hall) => (
          <article key={hall.id} className="card p-5">
            <h2 className="font-serif text-2xl">
              <Link href={`/halls/${hall.slug}`} className="text-ink no-underline hover:underline">
                {hall.name}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/75">{hall.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {hall.services.map((service) => (
                <Link
                  key={service.id}
                  href={servicePath(hall.slug, service.type)}
                  className="rounded-full border border-line px-3 py-1 text-sm text-ink no-underline hover:border-gold"
                >
                  {serviceTypeLabel[service.type]}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
