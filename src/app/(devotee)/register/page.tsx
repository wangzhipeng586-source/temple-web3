import Link from "next/link";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { firstParam, safeNext } from "@/lib/http";
import { registerAction } from "@/server/actions/auth";

export const metadata = { title: "注册" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
}) {
  const query = await searchParams;
  const next = safeNext(firstParam(query.next), "/halls");
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-serif text-3xl">注册</h1>
      <p className="mt-2 text-sm leading-6 text-ink/70">注册后为信众角色。管理员账号由种子数据或后续人工设置。</p>
      <div className="mt-4">
        <Flash error={firstParam(query.error)} />
      </div>
      <form action={registerAction} className="card mt-4 space-y-4 p-5">
        <input type="hidden" name="next" value={next} />
        <label className="label">
          姓名
          <input className="input" name="name" required minLength={2} maxLength={40} />
        </label>
        <label className="label">
          邮箱
          <input className="input" type="email" name="email" required autoComplete="email" />
        </label>
        <label className="label">
          密码
          <input className="input" type="password" name="password" required minLength={8} maxLength={72} autoComplete="new-password" />
        </label>
        <SubmitButton>注册并登录</SubmitButton>
      </form>
      <p className="mt-6 text-sm">
        已有账号？ <Link href={`/login?next=${encodeURIComponent(next)}`}>登录</Link>
      </p>
    </div>
  );
}
