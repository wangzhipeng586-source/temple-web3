import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { firstParam, safeNext } from "@/lib/http";
import { oidcMode } from "@/lib/oidc";
import { mockOAuthAction } from "@/server/actions/auth";

export const metadata = { title: "模拟登录" };

export default async function MockAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string | string[]; next?: string | string[]; error?: string | string[] }>;
}) {
  const query = await searchParams;
  const provider = firstParam(query.provider);
  if (provider !== "google" && provider !== "apple") notFound();
  const mode = oidcMode(provider);
  const next = safeNext(firstParam(query.next), "/halls");
  const label = provider === "google" ? "Google" : "Apple";

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-serif text-3xl">{label} 模拟登录</h1>
      {mode !== "mock" ? (
        <p className="mt-4 text-sm leading-6">当前已配置真实登录或关闭了模拟入口，此页不能创建会话。</p>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            没有检测到 {label} 密钥，因此停留在模拟流程。填写邮箱后会创建或登录一个信众账号，不会访问 {label}。
          </p>
          <div className="mt-4">
            <Flash error={firstParam(query.error)} />
          </div>
          <form action={mockOAuthAction} className="card mt-4 space-y-4 p-5">
            <input type="hidden" name="provider" value={provider} />
            <input type="hidden" name="next" value={next} />
            <label className="label">
              姓名
              <input className="input" name="name" maxLength={40} />
            </label>
            <label className="label">
              邮箱
              <input className="input" type="email" name="email" required />
            </label>
            <SubmitButton>继续</SubmitButton>
          </form>
        </>
      )}
      <p className="mt-6 text-sm">
        <Link href={`/login?next=${encodeURIComponent(next)}`}>返回登录</Link>
      </p>
    </div>
  );
}
