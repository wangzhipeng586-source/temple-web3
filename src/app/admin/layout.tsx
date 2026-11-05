import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/server/actions/auth";

const links = [
  { href: "/admin", label: "概览" },
  { href: "/admin/halls", label: "殿堂" },
  { href: "/admin/orders", label: "申请单" },
  { href: "/admin/inventory", label: "位置库存" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-ink md:grid md:grid-cols-[220px_1fr]">
      <aside className="bg-pine text-[#f4efe4]">
        <div className="px-4 py-5 font-serif text-xl">云寺院 · 管理</div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:block md:space-y-1" aria-label="管理导航">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block whitespace-nowrap rounded-md px-3 py-2 text-sm text-[#f4efe4] no-underline hover:bg-white/10">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden px-4 py-4 text-sm md:block">
          <Link href="/" className="text-[#e6d3a1] no-underline hover:underline">
            返回信众端
          </Link>
        </div>
      </aside>
      <div>
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-sm">
          <p>
            {user.name || "管理员"} · {user.email}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-ink/70 no-underline md:hidden">
              信众端
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="text-ink/70 hover:text-ink">
                退出
              </button>
            </form>
          </div>
        </div>
        <div className="px-4 py-6">{children}</div>
      </div>
    </div>
  );
}
