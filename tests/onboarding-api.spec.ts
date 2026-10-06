import { test, expect } from "@playwright/test";
import { POST, GET, PUT, PATCH, DELETE, OPTIONS, HEAD } from "../app/api/onboarding/route";
import type { OnboardingPayload } from "../lib/types";

const payload: OnboardingPayload = {
  company: { name: "Northstar Studio", website: "https://northstar.example.com", industry: "Other", size: "" },
  contact: { firstName: "Avery", lastName: "Reyes", email: "avery@northstar.example.com", phone: "" },
  project: { service: "SEO", package: "Authority", startDate: "2099-12-01", goals: "Increase qualified leads.", notes: "" },
};
const originalFetch = globalThis.fetch;
const originalUrl = process.env.MAKE_ONBOARDING_WEBHOOK_URL;
const request = (body: unknown = payload) => new Request("http://localhost/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.MAKE_ONBOARDING_WEBHOOK_URL;
  else process.env.MAKE_ONBOARDING_WEBHOOK_URL = originalUrl;
});

test("only POST is accepted; malformed and invalid payloads are not forwarded", async () => {
  globalThis.fetch = async () => { throw new Error("Must not forward an invalid request."); };
  for (const handler of [GET, PUT, PATCH, DELETE, OPTIONS, HEAD]) {
    const result = handler();
    expect(result.status).toBe(405);
    expect(result.headers.get("Allow")).toBe("POST");
    expect(await result.json()).toEqual({ success: false, error: "Method not allowed." });
  }
  expect((await POST(new Request("http://localhost/api/onboarding", { method: "POST", body: "text" }))).status).toBe(415);
  expect((await POST(new Request("http://localhost/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).status).toBe(400);
  for (const invalid of [null, {}, { ...payload, internalOwner: "staff" }, { ...payload, contact: { ...payload.contact, email: "invalid" } }, { ...payload, project: { ...payload.project, package: "Custom Build" } }]) {
    const result = await POST(request(invalid));
    expect(result.status).toBe(422);
    expect(await result.json()).toEqual({ success: false, error: "Invalid onboarding payload." });
  }
});

test("missing or invalid server configuration returns 503 without forwarding", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("Accepted"); };
  for (const url of [undefined, "", "   ", "not a URL", "ftp://example.com/webhook"]) {
    if (url === undefined) delete process.env.MAKE_ONBOARDING_WEBHOOK_URL;
    else process.env.MAKE_ONBOARDING_WEBHOOK_URL = url;
    const result = await POST(request());
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ success: false, error: "Onboarding submission is unavailable." });
  }
  expect(calls).toBe(0);
});

test("forwards the normalized JSON once and accepts plain-text Make responses", async () => {
  process.env.MAKE_ONBOARDING_WEBHOOK_URL = "https://hook.example.com/private-token";
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    expect(url).toBe(process.env.MAKE_ONBOARDING_WEBHOOK_URL);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(init?.body as string)).toEqual(payload);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.redirect).toBe("error");
    return new Response("Accepted", { status: 202 });
  };
  const result = await POST(request());
  expect(result.status).toBe(200);
  expect(result.headers.get("Cache-Control")).toBe("no-store");
  expect(await result.json()).toEqual({ success: true });
  expect(calls).toBe(1);
});

test("Make rejection, network failure and timeout return sanitized errors", async () => {
  process.env.MAKE_ONBOARDING_WEBHOOK_URL = "https://hook.example.com/private-token";
  for (const status of [400, 429, 500]) {
    globalThis.fetch = async () => new Response("private-token and sensitive upstream data", { status });
    const result = await POST(request());
    expect(result.status).toBe(502);
    expect(await result.json()).toEqual({ success: false, error: "Unable to submit onboarding details." });
  }
  globalThis.fetch = async () => { throw new Error("private-token connection failed"); };
  const failure = await POST(request());
  expect(failure.status).toBe(502);
  expect(await failure.text()).not.toContain("private-token");
  globalThis.fetch = async () => { throw new DOMException("private-token timeout", "TimeoutError"); };
  const timeout = await POST(request());
  expect(timeout.status).toBe(504);
  expect(await timeout.json()).toEqual({ success: false, error: "Onboarding submission timed out." });
});

test("production route returns JSON for unsupported methods and missing configuration", async ({ request: api }) => {
  const get = await api.get("/api/onboarding");
  expect(get.status()).toBe(405);
  expect(get.headers().allow).toBe("POST");
  expect(await get.json()).toMatchObject({ success: false });
  const invalid = await api.post("/api/onboarding", { data: {} });
  expect(invalid.status()).toBe(422);
  const unavailable = await api.post("/api/onboarding", { data: payload });
  expect(unavailable.status()).toBe(503);
  expect(await unavailable.json()).toEqual({ success: false, error: "Onboarding submission is unavailable." });
});
