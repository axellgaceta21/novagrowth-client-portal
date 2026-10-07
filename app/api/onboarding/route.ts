import { onboardingPayloadSchema } from "@/lib/onboarding-payload-schema";
import { onboardingResponseSchema } from "@/lib/onboarding-response-schema";

function json(body: object, status: number, headers?: HeadersInit) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

function methodNotAllowed() {
  return json({ success: false, error: "Method not allowed." }, 405, { Allow: "POST" });
}

export { methodNotAllowed as GET, methodNotAllowed as PUT, methodNotAllowed as PATCH, methodNotAllowed as DELETE, methodNotAllowed as HEAD, methodNotAllowed as OPTIONS };

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return json({ success: false, error: "Content-Type must be application/json." }, 415);
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return json({ success: false, error: "Invalid JSON request body." }, 400); }

  const parsed = onboardingPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return json({ success: false, error: "Invalid onboarding payload." }, 422);
  }

  // This environment variable is read exclusively in the server route.
  const webhookUrl = process.env.N8N_ONBOARDING_WEBHOOK_URL?.trim();
  try {
    if (!webhookUrl || !["https:", "http:"].includes(new URL(webhookUrl).protocol)) {
      return json({ success: false, error: "Onboarding webhook is not configured correctly." }, 503);
    }
  } catch { return json({ success: false, error: "Onboarding webhook is not configured correctly." }, 503); }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(10000),
      redirect: "error",
      cache: "no-store",
    });
    const upstream = onboardingResponseSchema.safeParse(await response.json());
    if (!upstream.success ||
      (response.ok && !upstream.data.success) ||
      (upstream.data.success && upstream.data.clientId !== parsed.data.submission.clientId)) {
      return json({ success: false, error: "Invalid onboarding webhook response." }, 502);
    }
    return json(upstream.data, response.status);
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return json({ success: false, error: timedOut ? "Onboarding submission timed out." : "Unable to submit onboarding details." }, timedOut ? 504 : 502);
  }
}
