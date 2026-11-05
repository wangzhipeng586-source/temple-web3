export function Flash({ error, success, notice }: { error?: string; success?: string; notice?: string }) {
  if (error) {
    return <p className="rounded-md border border-cinnabar/30 bg-cinnabar/5 px-3 py-2 text-sm text-cinnabar">{error}</p>;
  }
  if (success) {
    return <p className="rounded-md border border-pine/20 bg-pine/5 px-3 py-2 text-sm text-pine">{success}</p>;
  }
  if (notice) {
    return <p className="rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-ink/80">{notice}</p>;
  }
  return null;
}
