"use client";

import { ErrorPanel } from "@/components/error-panel";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorPanel reset={reset} />;
}
