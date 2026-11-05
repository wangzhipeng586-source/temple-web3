"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { createSession, clearSession } from "@/lib/auth";
import { publicError } from "@/lib/errors";
import { readString, safeNext } from "@/lib/http";
import { appleMaterialConfigured, googleConfigured } from "@/lib/oidc";
import { upsertOAuthUser } from "@/lib/oauth-user";
import { prisma } from "@/lib/prisma";
import { emailSchema, passwordSchema } from "@/lib/validators";

function loginError(message: string, next: string, email = "") {
  const params = new URLSearchParams({ error: message, next });
  if (email) params.set("email", email);
  redirect(`/login?${params.toString()}`);
}

export async function loginAction(formData: FormData) {
  const next = safeNext(readString(formData, "next"));
  const emailRaw = readString(formData, "email");
  const password = readString(formData, "password");
  try {
    const email = emailSchema.parse(emailRaw);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error("邮箱或密码不正确");
    }
    await createSession(user.id);
  } catch (error) {
    loginError(publicError(error, "邮箱或密码不正确"), next, emailRaw);
  }
  redirect(next);
}

export async function registerAction(formData: FormData) {
  const next = safeNext(readString(formData, "next"), "/halls");
  const emailRaw = readString(formData, "email");
  try {
    const email = emailSchema.parse(emailRaw);
    const name = readString(formData, "name");
    const password = passwordSchema.parse(readString(formData, "password"));
    if (name.length < 2 || name.length > 40) throw new Error("请填写 2–40 字的姓名");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, role: "DEVOTEE", provider: "EMAIL" },
    });
    await createSession(user.id);
  } catch (error) {
    const message =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
        ? "该邮箱已注册"
        : publicError(error);
    const params = new URLSearchParams({ error: message, next });
    redirect(`/register?${params.toString()}`);
  }
  redirect(next);
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function requestOtpPlaceholder(formData: FormData) {
  const next = safeNext(readString(formData, "next"));
  const emailRaw = readString(formData, "email");
  const params = new URLSearchParams({
    notice: "验证码登录尚未开通，请使用密码，或使用 Google / Apple。",
    next,
  });
  if (emailRaw) params.set("email", emailRaw);
  redirect(`/login?${params.toString()}`);
}

export async function mockOAuthAction(formData: FormData) {
  const provider = readString(formData, "provider");
  const next = safeNext(readString(formData, "next"), "/halls");
  const configured = provider === "apple" ? appleMaterialConfigured() : googleConfigured();
  if (provider !== "google" && provider !== "apple") {
    redirect("/login?error=" + encodeURIComponent("不支持的登录方式"));
  }
  if (configured || process.env.OIDC_MOCK === "false") {
    redirect("/login?error=" + encodeURIComponent("模拟登录已关闭"));
  }
  try {
    const email = emailSchema.parse(readString(formData, "email"));
    const name = readString(formData, "name");
    const user = await upsertOAuthUser({
      provider: provider === "apple" ? "APPLE" : "GOOGLE",
      sub: `mock:${email}`,
      email,
      name: name || null,
    });
    await createSession(user.id);
  } catch (error) {
    redirect(`/auth/mock?provider=${provider}&next=${encodeURIComponent(next)}&error=${encodeURIComponent(publicError(error))}`);
  }
  redirect(next);
}
