import { z } from "zod";

export const industries = ["E-commerce", "SaaS / Technology", "Health & Fitness", "Professional Services", "Real Estate", "Finance", "Education", "Food & Beverage", "Retail", "Other"] as const;
export const companySizes = ["1–10", "11–50", "51–200", "201–500", "500+"] as const;
export const services = ["Paid Advertising", "SEO", "Email Marketing", "Web Development", "Creative Design"] as const;
export const servicePackages = {
  "Paid Advertising": ["Starter", "Growth", "Scale"],
  "SEO": ["Foundation", "Growth", "Authority"],
  "Email Marketing": ["Starter", "Lifecycle", "Full Service"],
  "Web Development": ["Landing Page", "Business Website", "Custom Build"],
  "Creative Design": ["Essentials", "Growth", "Creative Partner"],
} as const satisfies Record<typeof services[number], readonly string[]>;

export function packagesForService(service: string): readonly string[] {
  return Object.hasOwn(servicePackages, service) ? servicePackages[service as keyof typeof servicePackages] : [];
}

// Local calendar date, rather than UTC, keeps date validation aligned with the client.
export function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const webUrl = z.string().trim().max(2048, "Keep the URL under 2,048 characters.").refine(value => {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname.includes(".")); }
  catch { return false; }
}, "Enter a valid website URL, including https://.");
const requiredText = (label: string, max: number) => z.string().trim().min(1, `Enter ${label}.`).max(max, `Use ${max} characters or fewer.`);

export const onboardingSchema = z.object({
  companyName: requiredText("your company name", 120),
  companyWebsite: webUrl,
  industry: z.string().refine(value => industries.includes(value as typeof industries[number]), "Select your industry."),
  companySize: z.string().refine(value => value === "" || companySizes.includes(value as typeof companySizes[number]), "Select a company size."),
  firstName: requiredText("your first name", 80),
  lastName: requiredText("your last name", 80),
  email: z.string().trim().max(254, "Use 254 characters or fewer.").email("Enter a valid work email."),
  phone: z.string().trim().max(40, "Use 40 characters or fewer."),
  service: z.string().refine(value => services.includes(value as typeof services[number]), "Select a primary service."),
  package: requiredText("a package", 80),
  startDate: z.string().refine(value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00`);
    return !Number.isNaN(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` === value && value >= localToday();
  }, "Choose a valid start date of today or later."),
  goals: requiredText("your primary project goals", 2000),
  notes: z.string().trim().max(2000, "Use 2,000 characters or fewer."),
}).superRefine((data, context) => {
  if (data.package && !packagesForService(data.service).includes(data.package)) {
    context.addIssue({ code: "custom", path: ["package"], message: "Select a package for your chosen service." });
  }
});

export type OnboardingData = z.infer<typeof onboardingSchema>;
