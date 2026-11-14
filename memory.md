# Memory — KYC Contracts, Campaign Universities, and Landing Downloads

Last updated: 2026-11-04 22:08 Africa/Lagos

## What was built

- Repositories: mobile `C:/Users/JESSE/Documents/Github Repo/taskhub-app`; web `C:/Users/JESSE/Documents/Github Repo/task-hub-webapp`; backend `C:/Users/JESSE/Documents/Github Repo/task-hub-backend`.
- Wallet loading now uses skeletons. Web sidebar/default Wallet returns to Home; both Profile wallet links set `?from=profile` so Back returns to Profile. Mobile preserves navigation history with a Home fallback. Changes pushed in mobile `79f190d` and web `07c851c`.
- Support call number changed everywhere known to +234 913 530 8859. WhatsApp stays +234 912 463 8396. Channel titles no longer contain em dashes. Existing personalized drafts still include current account names/email and readable contextual errors, with no raw codes or credentials.
- Backend new-task email updated in `utils/taskerEmailTemplates.js` and `utils/notificationUtils.js`: explicit task name, existing category/budget, View Task Details button, and fallback link to the configured FRONTEND_URL `/tasks/{taskId}` (production fallback www.ngtaskhub.com). Dynamic content is escaped. Latest backend changes were pulled/rebased without conflicts before pushing `9ebc3f1`.
- Fixed landing hero badge being hidden by the fixed navbar; constrained logo height/aspect ratio, adjusted hero spacing, moved desktop navigation to the breakpoint where it fits, anchored mobile menu to header bottom, and equalized Post a Task / Become a Tasker buttons. Web commit `c3228f3`.
- Implemented backend KYC duplicate contracts in both clients. Shared `lib/verification-status.ts` retains decisions and retry policy. Web `hooks/use-verification-status.ts` centralizes polling; adapters preserve backend messages and flags. Duplicate/fraud results stop polling/loading, close the active QoreID SDK, show the supplied error, and block launch until resubmissionAllowed is explicitly true. Didit launch also checks current backend permission; mobile refreshes account status before creating its hosted session. Verification/profile/onboarding views show errors and support actions instead of pending UI.
- Web admin KYC list/detail show red Duplicate identity / Fraud detected badges through `components/admin/KycRiskBadge.tsx`, with reviewReason in detail. Admin normalization preserves the risk fields.
- Brand campaign dropdown uses `/api/brand-campaigns/universities`, reads all pages, displays label, and submits value. No manually typed fallback. It verifies that the choice is still available before submission and shows readable labels in the summary.
- Web admin universities now use server pagination/search/state/platform/campaign filters. `lib/api/admin-universities.ts` adds typed list/detail APIs; existing university-filter consumers still receive all pages. Edit loads detail/usage. Platform archive and campaign visibility are independent. DELETE 409 shows returned users/taskers/tasks/campaigns/total counts and requires a separate archive confirmation; it never archives automatically. Existing create/update/delete hooks invalidate affected catalogues.
- User explicitly selected opening the existing web campaign form from mobile instead of building a native form. Mobile Settings now has BUSINESS → Brand Campaign, opening https://www.ngtaskhub.com/brand-campaign in the in-app browser.
- KYC/campaign work pushed as mobile `743d152` and web `7781bfd`; backend was not modified for those contracts.
- Latest landing change: `components/landing/app-downloads.tsx`, inserted in `components/landing/hero.tsx`. White download card overlaps the hero image's top edge, centered on phones and offset right on larger screens. Google Play uses the supplied google-play-store-icon.svg and links to https://play.google.com/store/apps/details?id=com.taskhub.connect. Apple button uses the supplied apple-app-store-icon.svg but remains commented out. Commit `5d3e73b` pushed to web main. Both ui-registry.md files record applicable new UI patterns.

## Decisions made

- Only Android is live per the user. Keep the Apple download action commented out until the user provides a published listing. Do not invent an iOS listing URL.
- Mobile remains Expo SDK 54 and uses Didit's hosted capture flow; QoreID capture SDK is web-only. Duplicate decisions apply across providers so changing verification method cannot bypass backend restrictions. Read exact SDK 54 documentation before mobile code changes, per root AGENTS.md. If Expo's versioned site redirects to latest, official raw docs on the Expo sdk-54 branch were accessible.
- For duplicate/fraud results, never infer permission from a generic rejected status. Require explicit backend resubmissionAllowed true before allowing another attempt. Show backend human-readable messages rather than technical decision codes.
- Campaign selectors use only backend-approved label/value pairs. campaignEnabled false affects campaign selectors only; isActive false archives platform-wide. Preserve independent controls and explicit archive confirmation after usage conflicts.
- Support destinations remain canonical in per-repo `lib/support-contact.ts`: Chat with Us → WhatsApp +234 912 463 8396; Call Us → dialer +234 913 530 8859. Draft context is temporary and account/screen scoped; matching recovery clears it. Preserve payment support's disabled query observer so it never creates an extra verification request.
- Preserve existing role-switch session handoff, email linking, and profile hydration retry behavior. User generally wants completed changes committed/pushed to main; pull/rebase current remote work without force-pushing.

## Problems solved

- Web verification adapter previously dropped duplicate/fraud flags and retry permission. Campaign form previously accepted typed university names, and admin pagination only covered a locally loaded subset.
- QoreID preparation timeout behavior remains intact: backend preparationTimeoutMs with 90000 fallback, stop at interactive readiness, no capture/webhook timeout, close on timeout and report SDK_TIMEOUT with the same reference, retry only after failure reporting succeeds, cleanup on close/success/error/unmount. A delayed reset response cannot overwrite a duplicate decision message.
- Browser fixtures needed the verification-status endpoint and UTF-8 Content-Type; without a charset, currency text assertions used mojibake. These were fixture problems and were corrected. University labels include required-field markup, so browser tests target the actual selector reliably.
- Both repositories use mixed line endings. Preserve unchanged bytes; use explicit UTF-8 for Python reads/writes. Earlier Windows default encoding corrupted em dashes, which was fixed. Do not normalize entire files unnecessarily.

## Current state

- All requested implementation work is complete and pushed. Last observed local/tracking main heads: mobile `743d152`, web `5d3e73b`, backend `9ebc3f1`; each was 0 ahead/0 behind its tracking branch. Actual remote pushes succeeded; this snapshot did not fetch again.
- Mobile/backend working trees were clean before this memory overwrite. Web has two unrelated local deletions: `public/assets/apple-store.png` and `public/assets/google-play.png`. They appeared during work, were left untouched/uncommitted, and are not needed by the new SVG download component. Do not restore, delete, or commit them without understanding the user's intent.
- Previous saved memory was committed/pushed as mobile `c471a8d` when the user asked to push everything. This newly approved overwrite is local only and has not been committed/pushed.
- Both TypeScript checks passed. Targeted KYC/campaign tests passed: web 17 browser checks including suite totals (QoreID lifecycle, duplicate blocking, polling stop, campus catalogue, submission, admin filtering/detail/flags and 409 archive prompt), plus 2 adapter/badge checks. Mobile 12 targeted checks passed including existing wallet/support regressions, plus the updated duplicate test confirms Settings opens the web campaign form. Existing lint debt remains; changed/new focused checks had no errors after fixes, with existing image/array-style warnings.
- Landing download card visually inspected and checked at 320, 390, 768, 1024 and 1440px: correct Google URL, SVG loaded, Apple hidden, card overlap correct, equal original CTA sizes, and no horizontal overflow. TypeScript and new component lint passed. Prior header/button fix was also checked from 320–1440px.
- No real emails, payments, deletions, university writes, verification submissions, WhatsApp messages, native builds, OTA releases, or store submissions were performed. Tests used fixtures/mocked APIs. Git push does not establish production deployment.

## Next session starts with

1. Restore this memory and establish the user's next task. Check working trees before edits; preserve the two unrelated web PNG deletions.
2. If asked about release readiness, check actual deployments/builds for these commits and perform safe native-device verification. Mobile campaign access depends on the web deployment containing the corrected selector.
3. For iOS store-button activation, obtain the actual published App Store listing, replace the commented placeholder button with a link, and match Google Play styling.
4. If preparing Apple resubmission, recheck App Store Connect and the selected replacement binary. Last read-only store observation was October 26: rejected build 10 selected, Age Assurance Yes. That is historical, not verified current state. Location prompt/purpose-string fixes were in source. Do not send Apple messages or submit a build without an explicit request.

## Open questions

- Have production deployments or native builds incorporated the latest main commits?
- Are the two local store-badge PNG deletions intentional?
- When will iOS be live, and what is its App Store URL?
- Has Apple's age-rating declaration been corrected or justified and a replacement binary selected? This session did not change store metadata.
