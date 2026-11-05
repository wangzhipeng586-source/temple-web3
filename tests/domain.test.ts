import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { decideOidc, signOidcState, verifyOidcState } from "../src/lib/oidc-state";
import { safeNext } from "../src/lib/http";
import { formatMoney, yuanToCents } from "../src/lib/money";
import { cancelBlockReason, fulfillmentBlockReason, payBlockReason, reviewBlockReason } from "../src/lib/order-state";
import { verifyStripeSignature } from "../src/lib/stripe";

test("yuan amounts convert to cents", () => {
  assert.equal(yuanToCents("68"), 6800);
  assert.equal(yuanToCents("68.5"), 6850);
  assert.equal(yuanToCents("68.50"), 6850);
  assert.equal(yuanToCents("0"), 0);
  assert.throws(() => yuanToCents("68.505"), /价格格式/);
  assert.throws(() => yuanToCents("-1"), /价格格式/);
});

test("money formatter keeps currency code readable", () => {
  assert.match(formatMoney(6800, "CNY"), /68/);
});

test("application review and payment transitions", () => {
  assert.equal(reviewBlockReason("SUBMITTED"), null);
  assert.ok(reviewBlockReason("APPROVED"));
  assert.equal(cancelBlockReason("SUBMITTED"), null);
  assert.ok(cancelBlockReason("APPROVED"));
  assert.equal(payBlockReason("PENDING_PAYMENT"), null);
  assert.ok(payBlockReason("PAID"));
  assert.equal(fulfillmentBlockReason("PAID", "PENDING", "IN_PROGRESS"), null);
  assert.equal(fulfillmentBlockReason("PAID", "IN_PROGRESS", "COMPLETED"), null);
  assert.ok(fulfillmentBlockReason("PENDING_PAYMENT", "PENDING", "IN_PROGRESS"));
  assert.ok(fulfillmentBlockReason("PAID", "PENDING", "COMPLETED"));
});

test("next paths reject open redirects", () => {
  assert.equal(safeNext("/orders/1"), "/orders/1");
  assert.equal(safeNext("https://evil.example"), "/");
  assert.equal(safeNext("//evil.example"), "/");
  assert.equal(safeNext("/\\evil"), "/");
});

test("oidc mode prefers real credentials over mock", () => {
  assert.equal(decideOidc(true, "true"), "real");
  assert.equal(decideOidc(false, undefined), "mock");
  assert.equal(decideOidc(false, "false"), "disabled");
});

test("signed oidc state round-trips", () => {
  process.env.AUTH_SECRET = "test-secret-value-123";
  const state = signOidcState({ provider: "google", next: "/halls/daxiong/pray" });
  const payload = verifyOidcState(state, "google");
  assert.equal(payload.next, "/halls/daxiong/pray");
  assert.throws(() => verifyOidcState(state, "apple"));
  assert.throws(() => verifyOidcState(`${state}x`, "google"));
});

test("stripe webhook signature accepts the current v1", () => {
  const secret = "whsec_test";
  const raw = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
  const timestamp = "1700000000";
  const signature = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  assert.equal(verifyStripeSignature(raw, `t=${timestamp},v1=${signature}`, secret, 1700000000 * 1000), true);
  assert.equal(verifyStripeSignature(raw, `t=${timestamp},v1=deadbeef`, secret, 1700000000 * 1000), false);
  assert.equal(verifyStripeSignature(raw, `t=${timestamp},v1=${signature}`, secret, 1700000000 * 1000 + 10 * 60 * 1000), false);
});
