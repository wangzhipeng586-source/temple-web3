export function TempleMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#1f3330" />
      <path d="M6.5 18.5 16 8l9.5 10.5" fill="none" stroke="#e6d3a1" strokeWidth="1.6" />
      <path d="M8 18.5h16V24H8z" fill="#f4efe4" />
      <path d="M14.5 20.2h3V24h-3z" fill="#8f3d36" />
    </svg>
  );
}
