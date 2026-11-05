import { ApplyScreen } from "@/components/apply-screen";
import { firstParam } from "@/lib/http";

export const metadata = { title: "点灯" };

export default async function LampPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  return <ApplyScreen slug={slug} type="LAMP" error={firstParam(query.error)} />;
}
