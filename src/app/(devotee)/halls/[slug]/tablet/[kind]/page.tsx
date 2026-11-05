import { notFound } from "next/navigation";
import type { ServiceType } from "@prisma/client";
import { ApplyScreen } from "@/components/apply-screen";
import { firstParam } from "@/lib/http";

const kinds: Record<string, ServiceType> = {
  auspicious: "AUSPICIOUS_TABLET",
  memorial: "MEMORIAL_TABLET",
};

export default async function TabletPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; kind: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { slug, kind } = await params;
  const type = kinds[kind];
  if (!type) notFound();
  const query = await searchParams;
  return <ApplyScreen slug={slug} type={type} error={firstParam(query.error)} />;
}
