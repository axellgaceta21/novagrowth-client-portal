import type { OnboardingData } from "./schema";
import type { OnboardingPayload, SubmissionMetadata } from "./types";

export function createSubmissionMetadata(): SubmissionMetadata {
  return { externalId: `onb_${crypto.randomUUID()}`, submittedAt: new Date().toISOString() };
}

// Optional values are always strings; blank values are represented by "".
// Operational fields belong to the submission response, never this payload.
export function buildOnboardingPayload(data: OnboardingData, submission = createSubmissionMetadata()): OnboardingPayload {
  return {
    submission,
    company: { name: data.companyName.trim(), website: data.companyWebsite.trim(), industry: data.industry, size: data.companySize },
    contact: { firstName: data.firstName.trim(), lastName: data.lastName.trim(), email: data.email.trim(), phone: data.phone.trim() },
    project: { service: data.service, package: data.package, startDate: data.startDate, goals: data.goals.trim(), notes: data.notes.trim() },
  };
}
