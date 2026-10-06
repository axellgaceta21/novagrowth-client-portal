# NovaGrowth Client Onboarding Portal

A single-page, responsive onboarding portal built with Next.js App Router, TypeScript, Tailwind CSS, React Hook Form, Zod, and Lucide. Phase 2A forwards onboarding details to a Make webhook through a server-side API. No authentication, database, ClickUp, Drive, Slack, or other integrations are included.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. All ten required fields validate inline and the first invalid field receives focus. Valid submission sends the normalized payload to `/api/onboarding`, which forwards it to Make. Only after Make returns a successful HTTP status does the portal show its existing personalized confirmation with a temporary `NG-XXXX` ID, onboarding status, and timestamp. Dates use the client's local calendar. The portal does not persist details locally; Make receives the submitted data when configured.

## Local Make configuration

Copy `.env.example` to `.env.local`, set `MAKE_ONBOARDING_WEBHOOK_URL` to your Make onboarding webhook URL, and restart the development server. Keep `.env.local` private and untracked. The variable must not have a `NEXT_PUBLIC_` prefix. It is read only in `app/api/onboarding/route.ts`; the browser calls only `/api/onboarding`.

For the first live test, have Make listen for a request and submit the portal form locally. A successful confirmation means Make accepted the HTTP request, not that downstream automation finished. Client ID, status, and timestamp are still temporary client-generated values in Phase 2A. A failed request preserves the entered form details and shows the existing inline retry message. Requests are not automatically retried; a timeout can occur after Make receives a request, so inspect Make before resubmitting if duplicate processing matters.

The endpoint accepts only POST with `Content-Type: application/json`. It revalidates the normalized payload using the approved field rules and rejects unknown/internal fields. Responses are JSON: 200 accepted, 400 malformed JSON, 405 unsupported method, 415 incorrect content type, 422 invalid payload, 503 missing/invalid webhook configuration, 502 upstream rejection/network failure, and 504 upstream timeout (10 seconds). Upstream response bodies, webhook URLs, and sensitive payload data are never returned or logged by the handler.

## Verify

```sh
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts a fresh production server on port 3100 with the webhook variable explicitly blank. UI tests intercept only `/api/onboarding`; route tests stub the upstream fetch. No test invokes a live Make webhook. Coverage includes API validation, forwarding, configuration errors, upstream failures/timeouts, client failure/retry, required fields, service/package dependency, loading and repeat submissions, confirmation values, keyboard focus, console errors, and layouts at 375, 768, 1024, and 1440 pixels. Screenshots are saved in `test-results/`.

## Deployment

Import this directory into Vercel as a Next.js project. Use `npm run build` and the default Next.js output settings. Configure `MAKE_ONBOARDING_WEBHOOK_URL` in the intended server environment before deployment. This repository does not deploy automatically.

## Future integration

`lib/schema.ts` owns validation and the service-specific package mapping. Changing service resets package selection; Zod also rejects mismatched combinations. `lib/onboarding-payload.ts` exposes `buildOnboardingPayload(data)` with the nested company/contact/project shape. Optional size, phone, and notes are consistently empty strings when blank. Internal operational fields are never included in the client payload.

`lib/submit-onboarding.ts` accepts the normalized payload, POSTs to `/api/onboarding`, checks `{ success: true }`, then returns `{ success: true, clientId, status, submittedAt }` with temporary operational data. `lib/onboarding-payload-schema.ts` reuses the existing field rules at the API boundary. The server route alone forwards to Make. A later phase can return real operational data without changing the form or confirmation layout. Temporary IDs do not guarantee uniqueness.

The reusable `components/brand-logo.tsx` provides a geometric SVG symbol and wordmark, with `symbolSize` and `showDescriptor` props. The symbol is decorative for screen readers because the brand name is visible as text. The favicon uses the same mark.

To run the same browser suite against the development application in PowerShell:

```powershell
$env:PORTAL_TEST_DEV = "1"
npm run test:e2e
Remove-Item Env:PORTAL_TEST_DEV
```

Development checks use port 3001, reusing a running development server there or starting one if needed. The default `npm run dev` uses port 3000 when available.
