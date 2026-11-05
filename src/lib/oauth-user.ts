import type { AuthProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function upsertOAuthUser(input: {
  provider: Extract<AuthProvider, "GOOGLE" | "APPLE">;
  sub: string;
  email: string;
  name?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  const bySub = await prisma.user.findFirst({
    where: { provider: input.provider, providerSub: input.sub },
  });
  if (bySub) {
    if (input.name && !bySub.name) {
      return prisma.user.update({ where: { id: bySub.id }, data: { name: input.name } });
    }
    return bySub;
  }

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        provider: input.provider,
        providerSub: input.sub,
        name: byEmail.name ?? input.name ?? undefined,
      },
    });
  }

  return prisma.user.create({
    data: {
      email,
      name: input.name || email.split("@")[0],
      provider: input.provider,
      providerSub: input.sub,
      role: "DEVOTEE",
    },
  });
}
