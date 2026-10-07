import { test, expect } from "@playwright/test";
import { POST, GET, PUT, PATCH, DELETE, OPTIONS, HEAD } from "../app/api/onboarding/route";
import type { OnboardingPayload } from "../lib/types";
import { submitOnboarding } from "../lib/submit-onboarding";
import { onboardingResponse } from "./onboarding-response";

const payload: OnboardingPayload = {
  submission: { externalId: "onb_550e8400-e29b-41d4-a716-446655440000", clientId: "NG-440000", submittedAt: "2026-10-06T02:00:00.000Z" },
  company: { name: "Northstar Studio", website: "https://northstar.example.com", industry: "Other", size: "" },
  contact: { firstName: "Avery", lastName: "Reyes", email: "avery@northstar.example.com", phone: "" },
  project: { service: "SEO", package: "Authority", startDate: "2099-12-01", goals: "Increase qualified leads.", notes: "" },
};
const originalFetch = globalThis.fetch;
const originalUrl = process.env.MAKE_ONBOARDING_WEBHOOK_URL;
const originalN8nUrl = process.env.N8N_ONBOARDING_WEBHOOK_URL;
const originalNodeEnv = process.env.NODE_ENV;
const request = (body: unknown = payload) => new Request("http://localhost/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test.beforeEach(() => {
  Object.assign(process.env, { NODE_ENV: "production" });
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.MAKE_ONBOARDING_WEBHOOK_URL;
  else process.env.MAKE_ONBOARDING_WEBHOOK_URL = originalUrl;
  if (originalN8nUrl === undefined) delete process.env.N8N_ONBOARDING_WEBHOOK_URL;
  else process.env.N8N_ONBOARDING_WEBHOOK_URL = originalN8nUrl;
  if (originalNodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
  else Object.assign(process.env, { NODE_ENV: originalNodeEnv });
});

test("Client ID is required, correctly formatted, and bound to the External ID", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("Accepted"); };
  const { clientId, ...missingClientId } = payload.submission;
  const invalid = [missingClientId, ...["", "NG-1047", "NG-a12f90", "NG-G12F90", "NG-A12F90"].map(clientId => ({ ...payload.submission, clientId }))];
  for (const submission of invalid) {
    const response = await POST(request({ ...payload, submission }));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ success: false, error: "Invalid onboarding payload." });
  }
  expect(calls).toBe(0);
});

test("submission metadata is required and invalid metadata is never forwarded", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("Accepted"); };
  const { submission, ...withoutSubmission } = payload;
  const invalidBodies = [withoutSubmission, { ...payload, submission: {} },
    ...["NG-1047", "onb_invalid", "550e8400-e29b-41d4-a716-446655440000"].map(externalId => ({ ...payload, submission: { ...submission, externalId } })),
    ...["", "not a date", "2026-02-30T00:00:00Z", "2026-10-06"].map(submittedAt => ({ ...payload, submission: { ...submission, submittedAt } }))];
  for (const body of invalidBodies) expect((await POST(request(body))).status).toBe(422);
  expect(calls).toBe(0);
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

for (const environment of ["development", "production"] as const) {
test(`${environment}: missing or invalid selected configuration returns 503 without fallback`, async () => {
  Object.assign(process.env, { NODE_ENV: environment });
  process.env.MAKE_ONBOARDING_WEBHOOK_URL = "https://make.example.com/webhook";
  process.env.N8N_ONBOARDING_WEBHOOK_URL = "https://n8n.example.com/webhook-test/onboarding";
  const selectedVariable = "N8N_ONBOARDING_WEBHOOK_URL";
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("Accepted"); };
  for (const url of [undefined, "", "   ", "not a URL", "ftp://example.com/webhook"]) {
    if (url === undefined) delete process.env[selectedVariable];
    else process.env[selectedVariable] = url;
    const result = await POST(request());
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ success: false, error: "Onboarding webhook is not configured correctly." });
  }
  expect(calls).toBe(0);
});

test(`${environment}: selects the correct provider and forwards normalized JSON unchanged`, async () => {
  Object.assign(process.env, { NODE_ENV: environment });
  process.env.MAKE_ONBOARDING_WEBHOOK_URL = "https://make.example.com/webhook";
  process.env.N8N_ONBOARDING_WEBHOOK_URL = "  https://n8n.example.com/webhook-test/onboarding  ";
  const expectedUrl = "https://n8n.example.com/webhook-test/onboarding";
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    expect(url).toBe(expectedUrl);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(init?.body as string)).toEqual(payload);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.redirect).toBe("error");
    return Response.json(onboardingResponse(payload.submission.clientId), { status: 201 });
  };
  const result = await POST(request());
  expect(result.status).toBe(201);
  expect(result.headers.get("Cache-Control")).toBe("no-store");
  expect(await result.json()).toEqual(onboardingResponse(payload.submission.clientId));
  expect(calls).toBe(1);
});
}

test("n8n rejection, network failure and timeout return sanitized errors", async () => {
  process.env.N8N_ONBOARDING_WEBHOOK_URL = "https://hook.example.com/private-token";
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
  expect(await unavailable.json()).toEqual({ success: false, error: "Onboarding webhook is not configured correctly." });
});

test("n8n invalid intake and upstream JSON errors preserve their status and body", async () => {
  process.env.N8N_ONBOARDING_WEBHOOK_URL = "https://n8n.example.com/webhook/onboarding";
  for (const status of [400, 429, 500]) {
    const body = { success: false, error: "INVALID_INTAKE", message: "Required onboarding information is missing or invalid." };
    globalThis.fetch = async () => Response.json(body, { status });
    const response = await POST(request());
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual(body);
  }
});

test("malformed upstream outcomes and mismatched Client IDs cannot succeed", async () => {
  process.env.N8N_ONBOARDING_WEBHOOK_URL = "https://n8n.example.com/webhook/onboarding";
  for (const body of [null, [], {}, { success: true }, { success: false, error: "INVALID_INTAKE", message: "Invalid" }, onboardingResponse("NG-A12F90")]) {
    globalThis.fetch = async () => Response.json(body);
    expect((await POST(request())).status).toBe(502);
  }
  for (const body of ["Accepted", "{", ""]) {
    globalThis.fetch = async () => new Response(body);
    expect((await POST(request())).status).toBe(502);
  }
});

for (const duplicate of [false, true]) {
  test(`complete request/response flow preserves Client ID (duplicate=${duplicate})`, async () => {
    process.env.N8N_ONBOARDING_WEBHOOK_URL = "https://n8n.example.com/webhook/onboarding";
    const body = { ...onboardingResponse(payload.submission.clientId, duplicate), workflowReference: "example" };
    globalThis.fetch = async (url, init) => {
      if (url === "/api/onboarding") return POST(new Request("http://localhost/api/onboarding", init));
      expect(url).toBe(process.env.N8N_ONBOARDING_WEBHOOK_URL);
      expect(JSON.parse(init?.body as string)).toEqual(payload);
      return Response.json(body);
    };
    const result = await submitOnboarding(payload);
    expect(result).toMatchObject(body);
    expect(result.clientId).toBe(payload.submission.clientId);
  });
}
