# Memory — TaskHub Mobile Non-Admin Parity

Last updated: 2026-09-16 14:31 +01:00

## What was built

- Brought the Expo SDK 54 mobile app to code-level non-admin parity with the TaskHub web app and backend.
- Corrected the task lifecycle to `assigned → in-progress → awaiting-confirmation → completed`: taskers submit a note and optional proof, users confirm, and only the backend confirmation releases escrow. Core files: `app/track-task.tsx`, `app/(main)/tasks.tsx`, and `lib/api/tasks.ts`.
- Expanded chat with cursor pagination, five-second polling, presence, correct sender avatars, document/image attachments, read state, notification navigation, and failure-safe drafts. Core files: `app/chat.tsx`, `app/(main)/messages.tsx`, `lib/api/chat.ts`, and `lib/api/queries.ts`.
- Added real session management, bulk logout, notification preferences, account deactivation, backend mode switching, action-aware notification navigation, dynamic support contacts/FAQs, and functional support/share/report entry points.
- Added authoritative financial features: official receipts, spending analytics, Stellar deposit information, bank/Stellar withdrawals, verified multi-bank management, and tasker withdrawal history. Core files include `app/wallet.tsx`, `app/withdraw.tsx`, `app/bank-account.tsx`, `app/receipt.tsx`, `app/transaction-history.tsx`, and `lib/api/wallet.ts`.
- Added screens: `app/device-sessions.tsx`, `app/notification-preferences.tsx`, `app/deactivate-account.tsx`, `app/spending-analytics.tsx`, and `app/stellar-deposit.tsx`.
- Replaced hardcoded tasker performance and review placeholders with backend-derived data. Removed fake Apple sign-in, fake pending badges, inactive controls, and development OTP logging.
- Mounted the backend's existing tasker withdrawal-history controller at `GET /api/wallet/tasker/withdrawals` in `task-hub-backend/routes/walletRoute.js`.
- Installed `expo-document-picker`, aligned `expo` and `expo-constants` to the supported SDK 54 patch versions, safely updated dependencies, and extended `ui-registry.md` with the new parity-screen patterns.

## Decisions made

- The backend remains authoritative for roles, state transitions, escrow, financial records, support settings, analytics, and payouts; the mobile client does not recreate business rules or simulate success.
- Task completion uses the backend's customer-confirmation workflow, not the legacy completion-code workflow.
- Chat uses polling because the backend exposes no socket transport.
- Bank details are verified through the gateway-backed legacy endpoint before being added to the backend's multi-bank collection.
- Unsupported features are not represented by fake UI: Apple authentication was removed because the backend has no Apple endpoint, and tasker notification preferences remain visibly unavailable because the endpoint is user-only.
- Admin functionality remains web-only and was deliberately excluded.

## Problems solved

- Fixed direct tasker completion that could conflict with escrow release rules.
- Fixed incoming chat messages using the wrong participant identity and drafts clearing after failed sends.
- Replaced fabricated receipt references, static FAQs/contact details, hardcoded KPIs, and logout/relogin account switching.
- Found that the web called tasker withdrawal history while the backend route was missing; exposed the already-existing controller without changing payout processing.
- Replaced the empty “reviews you gave” state with reviews derived from completed rated tasks.
- Preserved the web repository's pre-existing uncommitted changes; no web files were modified during this session.

## Current state

- Mobile checks pass: `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.
- Expo Doctor passes 18/18 checks.
- Android Expo export succeeds; Metro bundled 1,802 modules.
- Backend test suite passes 25/25 tests after the wallet route change.
- Mobile changes are uncommitted across the lifecycle, chat, wallet, auth/settings/support, dependency, and UI registry files. The backend has one uncommitted change in `routes/walletRoute.js`.
- `npm audit fix` applied safe updates. Twenty-four transitive advisories remain (9 high, 15 moderate); suggested fixes require breaking upgrades beyond Expo SDK 54 and were not forced.
- No secrets or credentials are stored in this memory.

## Next session starts with

Run `/remember restore`, then perform live two-account device testing against a safe backend environment: user posts and funds a task, tasker bids/starts/submits proof, user confirms, both review, and tasker checks the released balance and submits a test payout. Also verify OneSignal navigation, document uploads, hosted payment return behavior, KYC handoff, and Stellar memo handling on a development build.

## Open questions

- Production signoff still needs real user/tasker credentials plus payment, OneSignal, KYC, and Stellar test environments.
- The backend stores a transaction PIN but does not enforce it during withdrawal; mobile intentionally does not claim PIN protection.
- Notification preferences are backend-supported only for user accounts, not taskers.
- Decide separately whether to accept the remaining SDK-54 transitive audit advisories or plan a future Expo upgrade; do not run `npm audit fix --force` on the current branch.
