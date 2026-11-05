import { createHmac, randomBytes, timingSafeEqual } from "crypto";

type StatePayload = {
  provider: "google" | "apple";
  next: string;
  nonce: string;
  exp: number;
};

function secret() {
  const value = process.env.AUTH_SECRET ?? "";
  if (value.length < 16) {
    throw new Error("真实登录需要配置至少 16 位的 AUTH_SECRET");
  }
  return value;
}

export function signOidcState(payload: { provider: "google" | "apple"; next: string }) {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      nonce: randomBytes(16).toString("hex"),
      exp: Date.now() + 10 * 60 * 1000,
    } satisfies StatePayload),
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyOidcState(state: string, provider: "google" | "apple") {
  const separator = state.lastIndexOf(".");
  if (separator <= 0) throw new Error("登录状态无效，请重试");
  const body = state.slice(0, separator);
  const sig = state.slice(separator + 1);
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const actual = Buffer.from(sig);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) {
    throw new Error("登录状态无效，请重试");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as StatePayload;
  if (payload.provider !== provider || typeof payload.exp !== "number" || payload.exp < Date.now()) {
    throw new Error("登录已过期，请重试");
  }
  return payload;
}

export function decideOidc(configured: boolean, mockFlag: string | undefined): "real" | "mock" | "disabled" {
  if (configured) return "real";
  if (mockFlag === "false") return "disabled";
  return "mock";
}
