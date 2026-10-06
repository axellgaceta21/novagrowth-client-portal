import type { OnboardingPayload, SubmissionResult } from "./types";

// The browser calls only our same-origin API; Make configuration stays server-side.
export async function submitOnboarding(payload: OnboardingPayload): Promise<SubmissionResult> {
  const response = await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Onboarding submission failed.");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("success" in result) || result.success !== true) {
    throw new Error("Onboarding submission was not accepted.");
  }

  // Phase 2A: preserve temporary operational data only after Make acceptance.
  // Replace these values with server-returned operational data in a later phase.
  const random = crypto.getRandomValues(new Uint32Array(1))[0];
  return { success: true, clientId: `NG-${1000 + random % 9000}`, status: "Onboarding", submittedAt: new Date().toISOString() };
}
