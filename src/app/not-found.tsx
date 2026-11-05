import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <h1 className="font-serif text-3xl">页面不存在</h1>
      <p className="mt-3 text-sm text-ink/70">请从殿堂列表重新进入。</p>
      <Link href="/halls" className="btn-primary mt-6 no-underline">
        查看殿堂
      </Link>
    </div>
  );
}
