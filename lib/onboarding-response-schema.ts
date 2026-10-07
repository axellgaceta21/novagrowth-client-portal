import { z } from "zod";

// Preserve additional workflow response fields while checking the outcome contract.
export const onboardingResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    duplicate: z.boolean(),
    clientId: z.string().regex(/^NG-[0-9A-F]{6}$/),
    status: z.literal("Onboarding"),
    message: z.string(),
    driveFolderUrl: z.url(),
  }).passthrough(),
  z.object({ success: z.literal(false), error: z.string(), message: z.string() }).passthrough(),
]);
