# NovaGrowth Client Onboarding Portal

A single-page, responsive onboarding portal built with Next.js App Router, TypeScript, Tailwind CSS, React Hook Form, Zod, and Lucide. Onboarding details are forwarded to n8n through a server-side API. The portal has no authentication, database, or direct ClickUp, Drive, or Slack integrations; downstream automation belongs to n8n.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. All ten required fields validate inline and the first invalid field receives focus. Valid submission sends the normalized payload to `/api/onboarding`, which forwards it to n8n. A successful new-client or duplicate response shows the existing personalized confirmation with the same `submission.clientId` sent in the payload, onboarding status, and timestamp. Dates use the client's local calendar. The portal does not persist details locally.

## n8n configuration

Copy `.env.example` to `.env.local`, set `N8N_ONBOARDING_WEBHOOK_URL` to the published n8n production webhook URL (`/webhook/...`), and restart the development server. Both development and production use this variable exclusively, with no provider fallback. Keep `.env.local` private and untracked. The variable must not have a `NEXT_PUBLIC_` prefix. It is read only in `app/api/onboarding/route.ts`; the browser calls only `/api/onboarding`.

Submit the portal form locally to test the published workflow. n8n must return a JSON success response containing `success`, `duplicate`, matching `clientId`, `status: "Onboarding"`, `message`, and `driveFolderUrl`. Both `duplicate: false` and `duplicate: true` are successful outcomes. Client ID remains authoritative submission metadata; the confirmation timestamp remains the client-generated success time. A failed request preserves entered details and shows the existing inline retry message. Requests are not automatically retried; a timeout can occur after n8n receives a request.

The endpoint accepts only POST with `Content-Type: application/json`. It revalidates the normalized payload using the approved field rules and rejects unknown/internal fields. Valid n8n JSON outcomes are returned with their upstream HTTP status and all response fields preserved, including HTTP 400 `{ success: false, error: "INVALID_INTAKE", message: "..." }`. Local errors use 400 malformed JSON, 405 unsupported method, 415 incorrect content type, 422 invalid payload, 503 missing/invalid webhook configuration, 502 malformed upstream response/network failure, and 504 upstream timeout (10 seconds). Successful responses must include the submitted Client ID; malformed outcomes never count as success. No webhook URL or onboarding payload is logged, and raw non-JSON errors are not returned.

## Verify

```sh
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts a fresh production server on port 3100 with the webhook variable explicitly blank. UI tests intercept only `/api/onboarding`; route tests stub the upstream fetch. No test invokes a live n8n webhook. Coverage includes API validation, unchanged forwarding, new-client and duplicate outcomes, upstream JSON status/body propagation, malformed responses, Client ID consistency, configuration errors, upstream failures/timeouts, client failure/retry, required fields, service/package dependency, loading and repeat submissions, confirmation values, keyboard focus, console errors, and layouts at 375, 768, 1024, and 1440 pixels. Screenshots are saved in `test-results/`.

## Deployment

Import this directory into Vercel as a Next.js project. Use `npm run build` and the default Next.js output settings. Configure `N8N_ONBOARDING_WEBHOOK_URL` with the published production webhook URL in the intended server environment before deployment. This repository does not deploy automatically.

## Future integration

`lib/schema.ts` owns validation and the service-specific package mapping. Changing service resets package selection; Zod also rejects mismatched combinations. `lib/onboarding-payload.ts` exposes `buildOnboardingPayload(data)` with the nested company/contact/project shape. Optional size, phone, and notes are consistently empty strings when blank. Internal operational fields are never included in the client payload.

The normalized payload has four top-level objects in order: `submission`, `company`, `contact`, `project`. Submission metadata contains `externalId: "onb_<UUID v4>"`, `clientId: "NG-<last six UUID characters, uppercased>"`, and an ISO 8601 `submittedAt` creation timestamp. For example, `onb_550e8400-e29b-41d4-a716-446655440020` maps to `NG-440020`. The browser creates all three once when validated details are first submitted, then retains the complete payload in memory for retries of unchanged details after network or upstream failure. Editing validated details creates a new logical submission. Refreshing the page clears this in-memory attempt. The API requires an uppercase six-character hex Client ID and verifies its deterministic match to the External ID before forwarding metadata unchanged. This supplies an idempotency key for n8n to use; the portal does not itself implement downstream deduplication. The confirmation timestamp remains independent success data.

`lib/submit-onboarding.ts` accepts the normalized payload, POSTs to `/api/onboarding`, validates the workflow response, and returns the successful response fields with the existing confirmation timestamp. `lib/onboarding-response-schema.ts` validates the shared response contract while preserving extra workflow fields. Confirmation uses the matching response Client ID; no separate ID is generated. `lib/onboarding-payload-schema.ts` reuses the existing field rules at the API boundary. The server route alone forwards to n8n. The six-character Client ID is a short reference and can collide; the full UUID External ID remains the unique submission/idempotency identifier.

The reusable `components/brand-logo.tsx` provides a geometric SVG symbol and wordmark, with `symbolSize` and `showDescriptor` props. The symbol is decorative for screen readers because the brand name is visible as text. The favicon uses the same mark.

To run the same browser suite against the development application in PowerShell:

```powershell
$env:PORTAL_TEST_DEV = "1"
npm run test:e2e
Remove-Item Env:PORTAL_TEST_DEV
```

Development checks use port 3001, reusing a running development server there or starting one if needed. The default `npm run dev` uses port 3000 when available.
