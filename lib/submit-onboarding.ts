import type { OnboardingPayload, SubmissionResult } from "./types";
import { onboardingResponseSchema } from "./onboarding-response-schema";

// The browser calls only our same-origin API; webhook configuration stays server-side.
export async function submitOnboarding(payload: OnboardingPayload): Promise<SubmissionResult> {
  const response = await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Onboarding submission failed.");
  const result = onboardingResponseSchema.safeParse(await response.json());
  if (!result.success || !result.data.success || result.data.clientId !== payload.submission.clientId) {
    throw new Error("Onboarding submission was not accepted.");
  }

  // Confirmation uses the authoritative ID already sent in the accepted payload.
  return { ...result.data, submittedAt: new Date().toISOString() };
}
