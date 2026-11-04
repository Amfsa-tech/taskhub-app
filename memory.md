# Memory — Frontend Video Fixes and Personalized Support Drafts

Last updated: 2026-11-02 15:06 Africa/Lagos

## What was built

- Mobile repository: C:/Users/JESSE/Documents/Github Repo/taskhub-app. Web repository: C:/Users/JESSE/Documents/Github Repo/task-hub-webapp. Backend repository was out of scope and was not changed.
- Applied the November 1 video feedback: centered web authentication without the decorative half-screen panel; made Google sign-in fit small screens; replaced web primary Payment History navigation with Wallet; added one-tap mobile Wallet access; removed the duplicate web task-posting banner and its tour step. User explicitly chose to keep category shortcuts. Mobile category shortcuts now select the actual category and open services directly while clearing old drafts.
- Added shared support choosers, floating Need help actions, and payment-error support entry points on both clients. Web components are in components/support/; mobile components are components/taskhub/support-contact.tsx and support-widget.tsx. Additional context reaches wallet funding, withdrawals, payment callbacks, and web QoreID failures.
- Added lib/support-context.ts and hooks/use-support-message.ts in both repositories. WhatsApp drafts include the signed-in account's full name or first/last names, email, a readable failed-action explanation, and a labeled payment reference when available. API request wrappers supply scoped failure context without changing their request results or refresh behavior. Direct support links on help/contact pages and web landing/footer sections also use personalized drafts.
- Added tests/support-context.test.mjs and expanded the video-feedback tests in both repositories. Updated both ui-registry.md files.

## Decisions made

- Channel 1 is +234 912 463 8396, labeled Chat with Us, and always opens its WhatsApp chat. Channel 2 is +234 707 597 9682, labeled Call Us, and always opens the dialer. Never route the call number to WhatsApp or the chat number to a telephone call. Per-repository lib/support-contact.ts defines the canonical destinations.
- WhatsApp opens with a prefilled draft; the person sends it. Use current profile identity rather than invented placeholders. Anonymous visitors get no fabricated name or email.
- Do not concatenate raw backend errors, technical codes, stack traces, or credentials into drafts. Use the shared readable issue builder. Recent failure context is temporary, scoped to account and screen, cleared by matching recovery/navigation/account changes, and ignored when expired. Late API results and explicit old-account payment issues must not contaminate another account's draft.
- Payment support observes the existing funding-verification query with fetching disabled; it must not start another verification request or change payment processing.
- Auth-screen layout changes apply to web only. Other requested video fixes apply to web and mobile. Preserve existing account deletion, financial, and role-switch safeguards; do not modify the backend without authorization.
- Mobile uses Expo SDK 54. Follow root AGENTS.md and read exact versioned documentation before coding. Its active identity-verification flow uses Didit, not the web QoreID capture SDK.

## Problems solved

- Old landing links incorrectly sent the 707 support number to WhatsApp, and support labels treated both numbers as call lines. All known frontend support destinations now follow the required split.
- Floating help previously had no actual failure context, and existing support drafts lacked account identity. Readable contextual drafts now cover technical/generic failures without forwarding their raw text.
- Prevented stale errors and payment references from appearing after successful retries, navigation, account changes, or delayed responses. Preserved original context across session-refresh retries.
- Earlier web QoreID preparation fix remains in main: use backend preparationTimeoutMs with 90000 only as fallback; stop at SDK interactive readiness, not merely popup visibility; close on timeout and report SDK_TIMEOUT with the same client reference; allow another attempt only after failure reporting succeeds. Capture and final webhook processing are not timed. Cleanup handles close, success, failure, and unmount.

## Current state

- Latest commits were pushed and remote main was verified: mobile 28f2d80; web cbd3470. Earlier video/routing commits are mobile 3da5c1c and web 39d1960.
- All 24 mobile tests passed. Web support browser checks passed, including identity, readable errors, routing, missing/stored payment references, recovery, and observing payment results without new requests. Request/refresh tests and QoreID lifecycle regressions passed. Both TypeScript checks passed. No new lint issues were introduced; older web lint debt remains.
- Tests use fixtures and mocked native/API dependencies. No real WhatsApp message, payment, deletion, or account conversion was performed. No native build, OTA release, store submission, or production deployment was performed; a Git push does not establish deployment.
- Web working tree was clean after push. Mobile had only the pre-existing local memory.md change. This user-approved overwrite is a new local memory update; it is not committed or pushed.
- Earlier role creation/linking fixes in both directions were already pushed. Preserve their session handoff and profile-hydration retry behavior.

## Next session starts with

1. Run /remember restore and confirm the user's next task before making changes.
2. If asked about release readiness, check actual frontend deployment/build status for the latest commits. Device-test WhatsApp prefill and dialer routing using safe accounts, including an error followed by a successful retry and an account/screen change. Browser and renderer tests are not native-device validation.
3. If preparing Apple resubmission, recheck App Store Connect and the actual replacement binary. The last read-only inspection was October 26: rejected build 10 was selected and Age Assurance was Yes. Those observations are historical, not current verified state. Location permission wording/purpose-string fixes were present in source, but the selected binary was not inspected. Do not send Apple a message or submit a build without an explicit request.

## Open questions

- Have production deployments or new native builds incorporated the latest main commits?
- Has Apple's age-rating declaration been corrected or justified, and has a replacement iOS build been selected for review? No store changes were made during this session.
- No implementation work remains for the latest requested support-draft fixes. Live device and deployment validation remain unperformed.
