import type { OnboardingPayload, SubmissionResult } from "./types";

// Phase 1: this adapter is local only. Replace its body with the future webhook
// request and return the client ID supplied by the operational system.
export async function submitOnboarding(payload: OnboardingPayload): Promise<SubmissionResult> {
  // The mock deliberately does not transmit or persist the prepared payload.
  void payload;
  await new Promise(resolve => setTimeout(resolve, 1000));
  const random = crypto.getRandomValues(new Uint32Array(1))[0];
  return { success: true, clientId: `NG-${1000 + random % 9000}`, status: "Onboarding", submittedAt: new Date().toISOString() };
}
