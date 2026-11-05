import { importPKCS8, SignJWT } from "jose";
import { decideOidc } from "@/lib/oidc-state";

export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function appleMaterialConfigured() {
  return Boolean(
    process.env.APPLE_CLIENT_ID &&
      (process.env.APPLE_CLIENT_SECRET ||
        (process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY)),
  );
}

export function oidcMode(provider: "google" | "apple") {
  const configured = provider === "google" ? googleConfigured() : appleMaterialConfigured();
  return decideOidc(configured, process.env.OIDC_MOCK);
}

export async function appleClientSecret() {
  if (process.env.APPLE_CLIENT_SECRET) return process.env.APPLE_CLIENT_SECRET;
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!privateKey || !teamId || !keyId || !clientId) return null;
  const key = await importPKCS8(privateKey.replace(/\\n/g, "\n"), "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime("180d")
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .sign(key);
}

export function googleAuthorizeUrl(state: string) {
  const redirectUri = `${appUrl()}/auth/callback/google`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export function appleAuthorizeUrl(state: string) {
  const redirectUri = `${appUrl()}/auth/callback/apple`;
  const url = new URL("https://appleid.apple.com/auth/authorize");
  url.searchParams.set("client_id", process.env.APPLE_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("response_mode", "form_post");
  url.searchParams.set("scope", "name email");
  url.searchParams.set("state", state);
  return url.toString();
}
