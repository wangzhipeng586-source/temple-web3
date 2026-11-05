import { NextResponse } from "next/server";
import { appUrl, googleAuthorizeUrl, oidcMode } from "@/lib/oidc";
import { signOidcState } from "@/lib/oidc-state";
import { safeNext } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"), "/halls");
  const mode = oidcMode("google");
  if (mode === "disabled") {
    return NextResponse.redirect(new URL("/login?error=" + encodeURIComponent("Google 登录未配置"), appUrl()));
  }
  if (mode === "mock") {
    return NextResponse.redirect(new URL(`/auth/mock?provider=google&next=${encodeURIComponent(next)}`, appUrl()));
  }
  try {
    const state = signOidcState({ provider: "google", next });
    return NextResponse.redirect(googleAuthorizeUrl(state));
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法开始 Google 登录";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, appUrl()));
  }
}
