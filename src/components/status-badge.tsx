import { statusTone } from "@/lib/labels";

export function StatusBadge({ label }: { label: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ring-1 ${statusTone(label)}`}>{label}</span>;
}
