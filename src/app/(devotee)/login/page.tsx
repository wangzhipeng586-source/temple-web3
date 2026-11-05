import Link from "next/link";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { firstParam, safeNext } from "@/lib/http";
import { loginAction, requestOtpPlaceholder } from "@/server/actions/auth";

export const metadata = { title: "登录" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; notice?: string | string[]; next?: string | string[]; email?: string | string[] }>;
}) {
  const query = await searchParams;
  const next = safeNext(firstParam(query.next));
  const email = firstParam(query.email) ?? "";

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-serif text-3xl">登录</h1>
      <p className="mt-2 text-sm leading-6 text-ink/70">信众与管理员使用同一入口，权限由账号角色决定。</p>
      <div className="mt-4">
        <Flash error={firstParam(query.error)} notice={firstParam(query.notice)} />
      </div>
      <form action={loginAction} className="card mt-4 space-y-4 p-5">
        <input type="hidden" name="next" value={next} />
        <label className="label">
          邮箱
          <input className="input" type="email" name="email" required autoComplete="email" defaultValue={email} />
        </label>
        <label className="label">
          密码
          <input className="input" type="password" name="password" required autoComplete="current-password" minLength={8} />
        </label>
        <SubmitButton>登录</SubmitButton>
      </form>

      <form action={requestOtpPlaceholder} className="card mt-4 space-y-3 p-5">
        <input type="hidden" name="next" value={next} />
        <p className="text-sm font-medium">邮箱验证码</p>
        <p className="text-sm leading-6 text-ink/60">验证码通道尚未接通，提交后会停留在本页并说明原因。</p>
        <label className="label">
          邮箱
          <input className="input" type="email" name="email" required defaultValue={email} />
        </label>
        <SubmitButton className="btn-secondary">获取验证码</SubmitButton>
      </form>

      <div className="mt-4 grid gap-3">
        <Link className="btn-secondary no-underline" href={`/auth/google/start?next=${encodeURIComponent(next)}`}>
          使用 Google 登录
        </Link>
        <Link className="btn-secondary no-underline" href={`/auth/apple/start?next=${encodeURIComponent(next)}`}>
          使用 Apple 登录
        </Link>
        <p className="text-xs leading-5 text-ink/50">未配置对应密钥时，按钮会进入模拟登录。生产环境请设置 OIDC_MOCK=false。</p>
      </div>
      <p className="mt-6 text-sm">
        还没有账号？{" "}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-cinnabar">
          注册
        </Link>
      </p>
    </div>
  );
}
