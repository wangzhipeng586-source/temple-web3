import Link from "next/link";
import { loadTempleWithHalls } from "@/lib/halls";
import { servicePath, serviceTypeLabel } from "@/lib/labels";

export const metadata = { title: "殿堂" };

export default async function HallsPage() {
  const temple = await loadTempleWithHalls();
  const halls = temple?.halls ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-serif text-3xl">殿堂</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
        {temple ? `${temple.name}目前开放 ${halls.length} 座殿堂。选择殿堂后可进入对应办理。` : "尚未初始化寺院数据。"}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {halls.map((hall) => (
          <article key={hall.id} className="card flex flex-col p-5">
            <h2 className="font-serif text-2xl">{hall.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-ink/75">{hall.summary}</p>
            <ul className="mt-4 flex flex-wrap gap-2 text-sm">
              {hall.services.map((service) => (
                <li key={service.id}>
                  <Link href={servicePath(hall.slug, service.type)} className="text-cinnabar no-underline hover:underline">
                    {serviceTypeLabel[service.type]}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={`/halls/${hall.slug}`} className="btn-secondary mt-5 w-fit no-underline">
              查看殿堂
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
