import { z } from "zod";
import { onboardingSchema, packagesForService } from "./schema";

// Reuse the approved field rules at the server boundary. Unknown/internal
// fields are rejected rather than silently forwarded to the automation.
const fields = onboardingSchema.shape;
export const onboardingPayloadSchema = z.object({
  submission: z.object({
    externalId: z.string().regex(/^onb_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/, "Enter an onb_ identifier containing a valid UUID v4."),
    submittedAt: z.iso.datetime({ offset: true }),
  }).strict(),
  company: z.object({ name: fields.companyName, website: fields.companyWebsite, industry: fields.industry, size: fields.companySize }).strict(),
  contact: z.object({ firstName: fields.firstName, lastName: fields.lastName, email: fields.email, phone: fields.phone }).strict(),
  project: z.object({ service: fields.service, package: fields.package, startDate: fields.startDate, goals: fields.goals, notes: fields.notes }).strict(),
}).strict().superRefine(({ project }, context) => {
  if (project.package && !packagesForService(project.service).includes(project.package)) {
    context.addIssue({ code: "custom", path: ["project", "package"], message: "Select a package for your chosen service." });
  }
});
