import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { safeNext } from "@/lib/http";
import { appUrl } from "@/lib/oidc";
import { verifyOidcState } from "@/lib/oidc-state";
import { exchangeAppleCode } from "@/lib/oauth-exchange";
import { upsertOAuthUser } from "@/lib/oauth-user";
import { prisma } from "@/lib/prisma";

async function finish(request: Request, source: { code: string; state: string; userJson: string }) {
  if (!source.code) {
    return NextResponse.redirect(new URL("/login?error=" + encodeURIComponent("Apple 登录已取消"), appUrl()));
  }
  try {
    const payload = verifyOidcState(source.state, "apple");
    const profile = await exchangeAppleCode(source.code);
    let name: string | null = null;
    if (source.userJson) {
      const parsed = JSON.parse(source.userJson) as { name?: { firstName?: string; lastName?: string } };
      name = `${parsed.name?.firstName ?? ""} ${parsed.name?.lastName ?? ""}`.trim() || null;
    }
    if (!profile.email) {
      const existing = await prisma.user.findFirst({ where: { provider: "APPLE", providerSub: profile.sub } });
      if (!existing) throw new Error("Apple 未返回邮箱，请在授权页选择分享邮箱");
      await createSession(existing.id);
    } else {
      const user = await upsertOAuthUser({
        provider: "APPLE",
        sub: profile.sub,
        email: profile.email,
        name,
      });
      await createSession(user.id);
    }
    return NextResponse.redirect(new URL(safeNext(payload.next, "/halls"), appUrl()));
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Apple 登录失败";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, appUrl()));
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  return finish(request, {
    code: String(form.get("code") || ""),
    state: String(form.get("state") || ""),
    userJson: String(form.get("user") || ""),
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return finish(request, {
    code: url.searchParams.get("code") || "",
    state: url.searchParams.get("state") || "",
    userJson: "",
  });
}
