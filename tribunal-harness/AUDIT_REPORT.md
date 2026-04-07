# Tribunal Harness Codebase Audit Report

## Executive Summary
This exhaustive diagnostic review mapped the source code of the `tribunal-harness` project. The overall architecture is built with Next.js 15, React 19, TypeScript, and Tailwind CSS. The app delegates core logic tasks (like analysis and triage) to Anthropic's Claude API, wrapped in a centralized `claude-client.ts`. Most core features rely on synchronous operations for calculating deadlines, while routing mechanisms expose multiple APIs.

No catastrophic or systemic security flaws (like exposed credentials, keys hardcoded into components, or plain-text LocalStorage storage of secrets) were discovered directly in the core source files reviewed.

However, several test issues, logic patterns, and environmental configuration dependencies were identified and logged below.

## Security Findings

### 1. Hardcoded / Fallback Email Addresses
- **Severity**: Low
- **File**: `tribunal-harness/src/app/api/request-access/route.ts`
- **Location**: Line 33
- **Snippet**:
```typescript
    const notifyEmail = process.env.NOTIFY_EMAIL || "hello@tribunalharness.co.uk";
```
- **Impact**: Fallback emails are hardcoded. This could lead to a configuration error silently dropping or exposing important access requests if the default email is unmonitored or incorrect.
- **Recommendation**: Validate environment variable requirements rather than relying strictly on the fallback in production if the fallback email isn't a robust catch-all.

## Architecture & Logic Findings

### 1. Webhook Signatures Required but Disabled By Default
- **Severity**: Info
- **File**: `tribunal-harness/src/app/api/webhook/route.ts`
- **Location**: Lines 24-30
- **Snippet**:
```typescript
    const secret = process.env.WEBHOOK_SECRET;

    if (!secret) {
        return NextResponse.json(
            { error: "Webhook endpoint not configured. Set WEBHOOK_SECRET in environment." },
            { status: 503 }
        );
    }
```
- **Impact**: The endpoint performs a check to see if a secret is configured. While it blocks unsigned requests when unconfigured (returning 503), the dependency on an external environment variable for the `crypto` library HMAC means the webhook logic is essentially disabled in development environments lacking this variable.
- **Recommendation**: Ensure standard local development documentation references adding `WEBHOOK_SECRET` for testing webhook endpoints.

### 2. Test Suite Flakiness / Pre-existing Failures
- **Severity**: Medium
- **File**: `tribunal-harness/src/services/api-routes.test.ts`
- **Location**: Lines 67, 137
- **Impact**: Two tests in `api-routes.test.ts` are failing, one asserting a time calculation expected to equal `"2025-09-14"` but receiving `"2025-09-15"`, and another expecting `json.available` to be defined on a 404 response. As noted in the instructions, these failures are expected and are pre-existing issues likely tied to timezone flakiness and mocked return values that were incomplete.
- **Snippet (Failure 1)**: `expect(json.deadlines[0].original_deadline).toBe("2025-09-14");`
- **Snippet (Failure 2)**: `expect(json.available).toBeDefined();`

## Maintainability Findings

### 1. Unresolved Imports in Vite Config (Global Root/Test Harness Issue)
- **Severity**: Low
- **File**: Root level `vitest.config.ts` and `vite.config.js`
- **Impact**: Local tests triggered errors mapping Next.js imports (`vitest/config`) using standard `npm run test` outside the specific Next.js environment configurations or resolving vite. This creates maintainer friction. Using `TMPDIR=/tmp npx vitest run` circumvents execution issues but still surfaces resolution warnings because Vite is not correctly mapped in the root when executing sub-project Vitest tests.

## Ignored Files
- `tribunal-harness/public/robots.txt`: Simple static configuration.
- `tribunal-harness/.next/*`: Build artifacts.
- `tribunal-harness/node_modules/*`: External dependencies.
