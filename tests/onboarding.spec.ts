import { test, expect, type Page } from "@playwright/test";
import { onboardingSchema, servicePackages } from "../lib/schema";
import { buildOnboardingPayload } from "../lib/onboarding-payload";
import { submitOnboarding } from "../lib/submit-onboarding";

async function fillRequired(page: Page) {
  await page.getByLabel("Company name").fill("Northstar Studio");
  await page.getByLabel("Company website").fill("https://northstar.example.com");
  await page.getByLabel("Industry").selectOption("Professional Services");
  await page.getByLabel("First name").fill("Avery");
  await page.getByLabel("Last name").fill("Reyes");
  await page.getByLabel("Work email").fill("avery@northstar.example.com");
  await page.getByLabel("Primary service").selectOption("Web Development");
  await page.getByLabel("Package").selectOption("Business Website");
  await page.getByLabel("Preferred start date").fill("2099-12-01");
  await page.getByLabel("What are your primary goals").fill("Improve our website and generate qualified leads.");
}

test("all required fields report inline errors and focus the first input", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Submit onboarding" }).click();
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(10);
  await expect(page.getByLabel("Company name")).toBeFocused();
  for (const input of await page.locator('[aria-invalid="true"]').all()) {
    const errorId = await input.getAttribute("aria-describedby");
    await expect(page.locator(`#${errorId}`)).toBeVisible();
  }
});

test("rejects invalid email, URLs, and past dates; preserves entered data", async ({ page }) => {
  await page.goto("/");
  await fillRequired(page);
  await expect(page.locator(".introduction")).toBeVisible();
  await page.getByLabel("Company website").fill("not-a-url");
  await page.getByLabel("Work email").fill("avery@invalid");
  await page.getByLabel("Preferred start date").fill("2020-01-01");
  await page.getByRole("button", { name: "Submit onboarding" }).click();
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(3);
  await expect(page.getByText("Enter a valid work email.")).toBeVisible();
  await expect(page.getByText("Enter a valid website URL, including https://.")).toHaveCount(1);
  await expect(page.getByText("Choose a valid start date of today or later.")).toBeVisible();
  await expect(page.getByLabel("Company name")).toHaveValue("Northstar Studio");
});

test("local submission disables inputs and displays actual values and a generated client ID", async ({ page, baseURL }) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("request", request => { if (new URL(request.url()).origin !== new URL(baseURL!).origin) externalRequests.push(request.url()); });
  await page.goto("/");
  await fillRequired(page);
  await page.getByRole("button", { name: "Submit onboarding" }).click();
  await expect(page.getByRole("button", { name: "Submitting" })).toBeDisabled();
  await expect(page.locator(".introduction")).toBeVisible();
  await page.locator("form").evaluate(form => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await expect(page.getByLabel("Company name")).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Onboarding received" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Onboarding received" })).toBeFocused();
  await expect(page.getByText("Thanks, Avery.", { exact: false })).toContainText("Northstar Studio");
  await expect(page.locator("dd").filter({ hasText: /^NG-\d{4}$/ })).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: "Web Development" })).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: "Business Website" })).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: "Onboarding" })).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.locator(".introduction")).toHaveCount(0);
  await expect(page.getByText("Estimated completion time:", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Required fields", { exact: false })).toHaveCount(0);
  await expect(page.locator(".next-steps li").nth(2)).toContainText("Our team will contact you with the next steps.");
  await expect(page.getByText(/Submitted successfully ·/)).toBeVisible();
  await expect(page.locator("main")).not.toContainText(/\b(demo|preview|mock|portfolio project)\b/i);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

for (const width of [375, 768, 1024, 1440]) {
  test(`responsive layout and keyboard navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const symbol = page.locator(".brand-symbol");
    await expect(symbol).toHaveAttribute("aria-hidden", "true");
    await expect(symbol).toHaveCSS("width", width < 768 ? "24.5px" : "30px");
    await expect(page.locator(".wordmark")).toHaveText("NovaGrowth");
    await expect(page.locator("main")).not.toContainText(/\b(demo|preview|mock|portfolio project)\b/i);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/portal-${width}.png`, fullPage: true });
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to onboarding form" })).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Company name")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Company website")).toBeFocused();
    await expect(page.getByRole("link", { name: "Skip to onboarding form" })).toHaveCSS("opacity", "0");
    for (const label of ["Industry", "Company size", "First name", "Last name", "Work email", "Phone number", "Primary service", "Package", "Preferred start date", "What are your primary goals", "Additional notes"]) {
      await page.keyboard.press("Tab");
      // Chromium's native date control has separate month/day/year tab stops.
      if (label === "What are your primary goals") {
        for (let segment = 0; segment < 4 && !(await page.getByLabel(label).evaluate(el => el === document.activeElement)); segment++) {
          await expect(page.getByLabel("Preferred start date")).toBeFocused();
          await page.keyboard.press("Tab");
        }
      }
      await expect(page.getByLabel(label)).toBeFocused();
      if (label === "Primary service") await page.getByLabel(label).selectOption("Web Development");
    }
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Submit onboarding" })).toBeFocused();
    const first = await page.getByLabel("Company name").boundingBox();
    const second = await page.getByLabel("Company website").boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    if (width < 768) expect(second!.y).toBeGreaterThan(first!.y);
    else expect(second!.y).toBe(first!.y);
    await fillRequired(page);
    await page.getByRole("button", { name: "Submit onboarding" }).click();
    await expect(page.getByRole("heading", { name: "Onboarding received" })).toBeVisible();
    await expect(page.locator(".introduction")).toHaveCount(0);
    await expect(page.locator("header")).toBeVisible();
    const header = await page.locator("header").boundingBox();
    const icon = await page.locator(".success-icon").boundingBox();
    expect(icon!.y - (header!.y + header!.height)).toBeGreaterThan(40);
    expect(icon!.y - (header!.y + header!.height)).toBeLessThan(100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/success-${width}.png`, fullPage: true });
  });
}

test("packages depend on service, reset cleanly, and announce availability", async ({ page }) => {
  await page.goto("/");
  const packageField = page.getByLabel("Package");
  await expect(packageField).toBeDisabled();
  await expect(packageField.locator("option")).toHaveText(["Select a service first"]);
  for (const [service, packages] of Object.entries(servicePackages)) {
    await page.getByLabel("Primary service").selectOption(service);
    await expect(packageField).toBeEnabled();
    await expect(packageField).toHaveValue("");
    await expect(packageField.locator("option")).toHaveText(["Select your package", ...packages]);
    await expect(page.getByRole("status").filter({ hasText: `Packages available for ${service}.` })).toBeAttached();
    await packageField.selectOption(packages[0]);
  }
  await page.getByLabel("Primary service").selectOption("SEO");
  await page.getByRole("button", { name: "Submit onboarding" }).click();
  await expect(page.locator("#package-error")).toBeVisible();
  await page.getByLabel("Primary service").selectOption("Paid Advertising");
  await expect(page.locator("#package-error")).toHaveCount(0);
  await expect(packageField).toHaveValue("");
  await page.getByLabel("Primary service").selectOption("");
  await expect(packageField).toBeDisabled();
});

test("payload normalization and operational response stay separate", async () => {
  const data = onboardingSchema.parse({ companyName: "  Northstar Studio  ", companyWebsite: " https://northstar.example.com ", industry: "Other", companySize: "", firstName: " Avery ", lastName: " Reyes ", email: " avery@northstar.example.com ", phone: "  ", service: "SEO", package: "Authority", startDate: "2099-12-01", goals: " Increase qualified leads. ", notes: "  " });
  const payload = buildOnboardingPayload(data);
  expect(payload).toEqual({ company: { name: "Northstar Studio", website: "https://northstar.example.com", industry: "Other", size: "" }, contact: { firstName: "Avery", lastName: "Reyes", email: "avery@northstar.example.com", phone: "" }, project: { service: "SEO", package: "Authority", startDate: "2099-12-01", goals: "Increase qualified leads.", notes: "" } });
  const invalid = onboardingSchema.safeParse({ ...data, package: "Custom Build" });
  expect(invalid.success).toBe(false);
  if (!invalid.success) expect(invalid.error.issues.some(issue => issue.path[0] === "package")).toBe(true);
  const before = performance.now();
  const result = await submitOnboarding(payload);
  expect(performance.now() - before).toBeGreaterThanOrEqual(800);
  expect(result).toMatchObject({ success: true, status: "Onboarding", clientId: expect.stringMatching(/^NG-\d{4}$/) });
  expect(Number.isNaN(Date.parse(result.submittedAt))).toBe(false);
});
