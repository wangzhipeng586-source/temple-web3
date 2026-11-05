import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { safeNext } from "@/lib/http";
import { appUrl } from "@/lib/oidc";
import { verifyOidcState } from "@/lib/oidc-state";
import { exchangeGoogleCode } from "@/lib/oauth-exchange";
import { upsertOAuthUser } from "@/lib/oauth-user";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("error")) {
    return NextResponse.redirect(new URL("/login?error=" + encodeURIComponent("Google 登录已取消"), appUrl()));
  }
  try {
    const payload = verifyOidcState(url.searchParams.get("state") || "", "google");
    const profile = await exchangeGoogleCode(url.searchParams.get("code") || "");
    const user = await upsertOAuthUser({
      provider: "GOOGLE",
      sub: profile.sub,
      email: profile.email,
      name: profile.name,
    });
    await createSession(user.id);
    return NextResponse.redirect(new URL(safeNext(payload.next, "/halls"), appUrl()));
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Google 登录失败";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, appUrl()));
  }
}
