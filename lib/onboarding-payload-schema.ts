import { z } from "zod";
import { onboardingSchema, packagesForService } from "./schema";

// Reuse the approved field rules at the server boundary. Unknown/internal
// fields are rejected rather than silently forwarded to the automation.
const fields = onboardingSchema.shape;
export const onboardingPayloadSchema = z.object({
  company: z.object({ name: fields.companyName, website: fields.companyWebsite, industry: fields.industry, size: fields.companySize }).strict(),
  contact: z.object({ firstName: fields.firstName, lastName: fields.lastName, email: fields.email, phone: fields.phone }).strict(),
  project: z.object({ service: fields.service, package: fields.package, startDate: fields.startDate, goals: fields.goals, notes: fields.notes }).strict(),
}).strict().superRefine(({ project }, context) => {
  if (project.package && !packagesForService(project.service).includes(project.package)) {
    context.addIssue({ code: "custom", path: ["project", "package"], message: "Select a package for your chosen service." });
  }
});
