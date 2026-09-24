# Memory — Taskhub Identity, Navigation, and App Store Handoff

Last updated: 2026-09-18 13:31 +01:00

## What was built

- Implemented a canonical `AuthIdentity` layer in `C:\Users\JESSE\Documents\Github Repo\task-hub-backend` so one identity owns linked User and Tasker roles and can use local, Google, and Apple authentication.
- Added secure native Sign in with Apple, including nonce and state validation, authorization-code exchange, encrypted refresh-token storage, token revocation, connected-provider management, and Apple server-to-server notifications.
- Hardened Google sign-in and account selection. Social accounts are linked only by verified provider subject or explicit credential proof, never by email alone.
- Updated role creation, explicit role linking, role switching, session clearing, and full identity deletion so both linked roles and associated personal data are handled together.
- Added backend identity migration, Apple configuration validation, rollout documentation, and tests.
- Added mobile Connected Accounts and Link Existing Role screens, Apple and Google login/signup flows, fresh social reauthentication for deletion, and linked-role creation.
- Fixed onboarding double navigation by making completion single-fire and replacing the onboarding route with `/purpose`.
- Created `app/taskers.tsx`, a native Browse Taskers directory modeled on the web version, with live data, search, category filters, nearest/top-rated/popular sorting, tasker profile navigation, pull-to-refresh, and complete loading/error/empty/content states. Home “See all” now opens it.
- Created corrected 13-inch iPad screenshots in `C:\Users\JESSE\Downloads\Taskhub mobile app (6)\ios\ipad-13-inch-no-alpha`. All six are opaque RGB PNGs at 2064 by 2752 pixels. The original RGBA files remain untouched.

## Decisions made

- The store name is Taskhub Connect.
- The iOS bundle identifier is `com.amfsatech.taskhub`; the Android package is `com.taskhub.connect`.
- One canonical identity owns both roles. Matching email addresses alone are never sufficient to merge or link accounts.
- Apple refresh tokens remain backend-only and encrypted. Apple-specific personal metadata is erased when authorization is revoked.
- Permanent deletion covers every linked role. Required de-identified financial records may be retained, while personal data, sessions, KYC records, payout details, conversations, and uploaded media are removed or anonymized according to the deletion service.
- Store-facing copy must never use an em dash.
- Production database migration and deployment must be deliberate manual release steps and were not run locally.
- UI directory patterns are recorded in `ui-registry.md` and use the established Taskhub canvas, card, spacing, typography, and async-state standards.

## Problems solved

- Removed the race between the final onboarding auto-advance timer and the Get Started button that could push the role-selection route twice.
- Replaced the no-op Top Taskers “See all” action with a working tasker-directory route.
- Made nearby-tasker React Query keys coordinate-aware while retaining prefix invalidation and the backend top-rated fallback when coordinates are unavailable.
- Added Apple relay-email enabled/disabled handling and recognition of both Apple account-deletion event variants.
- Added `npm run check:apple-auth` to the backend. It validates required variable names and key formats without printing secret values.
- Diagnosed Apple’s screenshot rejection: the iPad PNGs contained real alpha values. Flattened them onto white and verified RGB bands, PNG color type 2, unchanged dimensions, and zero pixel differences from the correctly composited appearance.

## Current state

- Mobile TypeScript and Expo lint pass with no errors or warnings after the latest navigation and tasker-directory work.
- Backend tests pass: 39 of 39. Backend syntax checks and auth-route imports pass.
- Expo SDK 54 configuration resolves with `usesAppleSignIn: true`, the Apple authentication plugin, and the correct iOS and Android identifiers.
- The backend Apple configuration checker currently reports missing Apple production environment variables until they are added to the backend environment. No secret values are stored here.
- The Apple notification route is implemented at `/api/auth/apple/notifications`. The intended production URL is `https://task-hub-backend.onrender.com/api/auth/apple/notifications` after the updated backend is deployed.
- No production backend deployment, identity migration, Apple portal notification save, or physical-device Apple sign-in test was completed in this session.
- The mobile and backend working trees contain uncommitted changes. Preserve unrelated existing changes, especially backend `routes/walletRoute.js` work.
- Google Play production build was uploaded for review previously. Google Ads remains intentionally unstarted.

## Next session starts with

1. Add the required Apple production values to the backend host environment using values from the Apple Developer account. Do not paste or commit them into source control.
2. From `C:\Users\JESSE\Documents\Github Repo\task-hub-backend`, run `npm run check:apple-auth` in the configured environment.
3. Back up the production database, deploy the additive backend identity changes, then run `npm run migrate:auth-identities` and verify the migration is idempotent.
4. In Apple Developer, edit primary App ID `com.amfsatech.taskhub` and save the server-to-server notification endpoint `https://task-hub-backend.onrender.com/api/auth/apple/notifications`.
5. Build a new signed iOS binary because the Apple capability is native, then test Apple sign-in, Google sign-in, provider linking, creating/linking both roles, switching roles, revocation, and deletion on a physical device.
6. Upload the corrected images from `C:\Users\JESSE\Downloads\Taskhub mobile app (6)\ios\ipad-13-inch-no-alpha` to the 13-inch iPad screenshot slot.

## Open questions

- Confirm all Apple production environment values have been installed on the backend host and that `npm run check:apple-auth` passes there.
- Confirm the updated backend route is publicly deployed before saving or testing Apple’s notification endpoint.
- Complete live end-to-end tests using distinct local, Google, and Apple identities, including same-email unrelated accounts and identities with both User and Tasker roles.
- Decide when to commit the coordinated mobile and backend changes and whether to separate unrelated pre-existing working-tree changes first.
