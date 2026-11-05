import { ZodError } from "zod";

function isSafeMessage(message: string) {
  return message.length > 0 && message.length <= 80 && !/prisma|sql|secret|password|token|stack/i.test(message);
}

export function rethrowNext(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_")
  ) {
    throw error;
  }
}

export function publicError(error: unknown, fallback = "操作失败，请稍后重试") {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "请检查表单";
  }
  if (error instanceof Error && isSafeMessage(error.message)) {
    return error.message;
  }
  console.error(error);
  return fallback;
}
