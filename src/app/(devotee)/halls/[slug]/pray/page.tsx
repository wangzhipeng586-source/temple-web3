import { ApplyScreen } from "@/components/apply-screen";
import { firstParam } from "@/lib/http";

export const metadata = { title: "祈福" };

export default async function PrayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  return <ApplyScreen slug={slug} type="PRAYER" error={firstParam(query.error)} />;
}
