import { createRemoteJWKSet, jwtVerify } from "jose";
import { appUrl, appleClientSecret } from "@/lib/oidc";

const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export async function exchangeGoogleCode(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: `${appUrl()}/auth/callback/google`,
    grant_type: "authorization_code",
  });
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenResponse.ok || !tokenJson.access_token) {
    console.error("Google token exchange failed", tokenResponse.status);
    throw new Error("Google 授权失败");
  }
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profile = (await profileResponse.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
  if (!profileResponse.ok || !profile.sub || !profile.email || profile.email_verified === false) {
    throw new Error("Google 账号未提供已验证邮箱");
  }
  return { sub: profile.sub, email: profile.email, name: profile.name ?? null };
}

export async function exchangeAppleCode(code: string) {
  const clientSecret = await appleClientSecret();
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientSecret || !clientId) throw new Error("Apple 登录未配置");
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: `${appUrl()}/auth/callback/apple`,
  });
  const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = (await tokenResponse.json()) as { id_token?: string };
  if (!tokenResponse.ok || !tokenJson.id_token) {
    console.error("Apple token exchange failed", tokenResponse.status);
    throw new Error("Apple 授权失败");
  }
  const { payload } = await jwtVerify(tokenJson.id_token, appleJwks, {
    issuer: "https://appleid.apple.com",
    audience: clientId,
  });
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const email = typeof payload.email === "string" ? payload.email : "";
  if (!sub) throw new Error("Apple 登录未返回用户标识");
  return { sub, email };
}
