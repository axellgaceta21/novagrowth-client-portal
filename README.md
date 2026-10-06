# NovaGrowth Client Onboarding Portal

A single-page, responsive onboarding portal built with Next.js App Router, TypeScript, Tailwind CSS, React Hook Form, Zod, and Lucide. Phase 1 is a local interactive demo: no authentication, database, external API, email, or automation integrations.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. All ten required fields validate inline, the first invalid field receives focus, and valid submission simulates a one-second request before replacing the form with a personalized confirmation and a mock `NG-XXXX` ID. Dates use the client's local calendar. Entered information stays in React memory and is lost on refresh; nothing is sent or persisted.

## Verify

```sh
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts a fresh production server on port 3100. It covers required fields, invalid URLs/email, past dates, loading/disabled states, repeated submission attempts, submitted values, client IDs, service/package dependency and resets, normalized payloads, keyboard focus, console errors, absence of external requests, and form/success layouts at 375, 768, 1024, and 1440 pixels. Screenshots are saved in `test-results/`.

## Deployment

Import this directory into Vercel as a Next.js project. Use `npm run build` and the default Next.js output settings. No environment variables are needed. This repository does not deploy automatically.

## Future integration

`lib/schema.ts` owns validation and the service-specific package mapping. Changing service resets package selection; Zod also rejects mismatched combinations. `lib/onboarding-payload.ts` exposes `buildOnboardingPayload(data)` with the nested company/contact/project shape. Optional size, phone, and notes are consistently empty strings when blank. Internal operational fields are never included in the client payload.

`lib/submit-onboarding.ts` accepts the normalized payload and returns `{ success: true, clientId, status, submittedAt }`. Replace only the adapter internals with an appropriate server-backed integration in a later phase. Mock IDs are temporary and do not guarantee uniqueness. The confirmation renders submitted company/contact/service/package values and the returned operational status, client ID, and timestamp. Client-facing copy intentionally contains no demo language; this Phase 1 implementation still transmits and stores nothing.

The reusable `components/brand-logo.tsx` provides a geometric SVG symbol and wordmark, with `symbolSize` and `showDescriptor` props. The symbol is decorative for screen readers because the brand name is visible as text. The favicon uses the same mark.

To run the same browser suite against the development application in PowerShell:

```powershell
$env:PORTAL_TEST_DEV = "1"
npm run test:e2e
Remove-Item Env:PORTAL_TEST_DEV
```

Development checks use port 3001, reusing a running development server there or starting one if needed. The default `npm run dev` uses port 3000 when available.
