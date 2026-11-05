import { NextResponse } from "next/server";
import { safeNext } from "@/lib/http";
import { appUrl, appleAuthorizeUrl, oidcMode } from "@/lib/oidc";
import { signOidcState } from "@/lib/oidc-state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"), "/halls");
  const mode = oidcMode("apple");
  if (mode === "disabled") {
    return NextResponse.redirect(new URL("/login?error=" + encodeURIComponent("Apple 登录未配置"), appUrl()));
  }
  if (mode === "mock") {
    return NextResponse.redirect(new URL(`/auth/mock?provider=apple&next=${encodeURIComponent(next)}`, appUrl()));
  }
  try {
    const state = signOidcState({ provider: "apple", next });
    return NextResponse.redirect(appleAuthorizeUrl(state));
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法开始 Apple 登录";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, appUrl()));
  }
}
