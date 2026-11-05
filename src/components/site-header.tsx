import Link from "next/link";
import type { CurrentUser } from "@/lib/auth";
import { TempleMark } from "@/components/temple-mark";

export function SiteHeader({ user }: { user: CurrentUser | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg text-ink no-underline">
          <TempleMark />
          云寺院
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm" aria-label="信众导航">
          <Link href="/halls" className="text-ink/80 no-underline hover:text-ink">
            殿堂
          </Link>
          {user ? (
            <Link href="/orders" className="text-ink/80 no-underline hover:text-ink">
              我的申请
            </Link>
          ) : null}
          {user?.role === "ADMIN" ? (
            <Link href="/admin" className="text-ink/80 no-underline hover:text-ink">
              管理端
            </Link>
          ) : null}
          {user ? (
            <Link href="/account" className="text-ink no-underline">
              {user.name || "账号"}
            </Link>
          ) : (
            <Link href="/login" className="btn-primary no-underline">
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
