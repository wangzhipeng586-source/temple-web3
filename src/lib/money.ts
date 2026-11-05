const CURRENCIES = ["CNY", "USD", "HKD", "SGD", "TWD", "EUR"] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

export function isCurrency(value: string): value is CurrencyCode {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function yuanToCents(input: string) {
  const normalized = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("价格格式不正确，请填写元，最多两位小数");
  }
  const [yuan, frac = ""] = normalized.split(".");
  const cents = Number(yuan) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > 100_000_000) {
    throw new Error("价格超出可登记范围");
  }
  return cents;
}

export function formatMoney(cents: number, currency = "CNY") {
  try {
    return new Intl.NumberFormat("zh-CN", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

export { CURRENCIES };
