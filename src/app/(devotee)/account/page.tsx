import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/server/actions/auth";

export const metadata = { title: "账号" };

const providerLabel = { EMAIL: "邮箱", GOOGLE: "Google", APPLE: "Apple" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-serif text-3xl">账号</h1>
      <dl className="card mt-6 space-y-3 p-5 text-sm">
        <div>
          <dt className="text-ink/50">姓名</dt>
          <dd>{user.name || "未填写"}</dd>
        </div>
        <div>
          <dt className="text-ink/50">邮箱</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt className="text-ink/50">角色</dt>
          <dd>{user.role === "ADMIN" ? "管理员" : "信众"}</dd>
        </div>
        <div>
          <dt className="text-ink/50">登录方式</dt>
          <dd>{providerLabel[user.provider]}</dd>
        </div>
      </dl>
      <form action={logoutAction} className="mt-6">
        <SubmitButton className="btn-secondary">退出登录</SubmitButton>
      </form>
    </div>
  );
}
