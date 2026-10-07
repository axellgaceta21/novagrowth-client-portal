import type { OnboardingData } from "./schema";

export type SubmissionMetadata = { externalId: string; clientId: string; submittedAt: string };

export type OnboardingPayload = {
  submission: SubmissionMetadata;
  company: { name: string; website: string; industry: string; size: string };
  contact: { firstName: string; lastName: string; email: string; phone: string };
  project: { service: string; package: string; startDate: string; goals: string; notes: string };
};

export type SubmissionResult = { success: true; duplicate: boolean; clientId: string; status: "Onboarding"; message: string; driveFolderUrl: string; submittedAt: string };
export type Confirmation = SubmissionResult & { data: OnboardingData };
