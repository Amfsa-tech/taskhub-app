# Memory — TaskHub Release Handoff

Last updated: 2026-10-09 21:58 Africa/Lagos

## What was built

- Implemented optional bidding deadlines across three repositories: mobile `C:\Users\JESSE\Documents\Github Repo\taskhub-app`, web `C:\Users\JESSE\Documents\Github Repo\task-hub-webapp`, backend `C:\Users\JESSE\Documents\Github Repo\task-hub-backend`.
- Backend: added `utils/biddingDeadline.js`, replaced the old 14-day stale-task cancellation in `utils/cronJobs.js` with a five-minute expired-unbid-task sweep, added `closed` Task status, guarded new bids against expired deadlines, and added `POST /api/tasks/:id/reopen`. Closure/refund and reopen/escrow reserve use MongoDB transactions and ledger rows. Open-task cancellation/refund was made transactional; task budget edits are blocked because they would desync escrow. Added `tests/biddingDeadline.test.js`.
- Web: posting/editing forms now have an optional bidding date; task detail and cards label it as a bidding cutoff. Owner History gained a Closed tab with Reopen/Delete controls. Tasker application UI hides new-bid form after cutoff. Added the reopen API binding and `closed` task type.
- Mobile: added the SDK 54-compatible native date picker to post/edit flows; review screen includes the selected deadline. Added a Closed tab, reopen action in task details, no-deadline messaging, and status-aware task actions. Updated `ui-registry.md` with the new form and action-sheet patterns.
- Prepared a WhatsApp tester message covering earlier authentication, onboarding, task posting, verification, bidding, chat, self-dealing, and this new deadline flow. It instructs testers to wait for deployment, use throwaway accounts for deletion, and avoid unapproved real-money payment tests.

## Decisions made

- Deadline means last time to place a bid, not work completion due date. Date-only cutoff is 11:59:59.999 p.m. Africa/Lagos. A task with no deadline stays open until other lifecycle action.
- At expiry, automatically close and refund only if there are zero active bids. If a bid exists, owner can still review/accept it, but no new bids may be placed. If the last active bid is withdrawn after expiry, the sweep can close/refund it. Reopening can use no deadline or a new future date, and re-reserves the task budget from the User wallet. No grace-period feature yet.
- User and Tasker accounts belonging to the same person must not transact/review each other. Minimum signup age is 18+. Android package is `com.taskhub.connect`, iOS bundle is `com.amfsatech.taskhub`. Store-facing copy should not use an em dash.
- Preserve pre-existing uncommitted work in all repositories; there are unrelated auth, profile, chat, and blog changes in the working trees.

## Problems solved

- Removed the backend's prior 14-day expiry behavior, which conflicted with indefinite tasks.
- Added a task-document write in the ordinary bid transaction so bid insertion conflicts with a concurrent auto-close transaction. Added cutoff checks to invite/hire request paths as well.
- Prevented post-publication budget edits from silently changing the budget while a different amount is held in escrow.

## Current state

- Local backend suite passes 66/66 tests; mobile and web `npx tsc --noEmit` pass; syntax and `git diff --check` pass apart from harmless Git line-ending warnings. No live wallet mutation or deployment was performed for the deadline work.
- Formal review found release gaps: mobile Closed tab currently fetches only the backend's default first 10 tasks, while web Closed history fetches at most 100; both need pagination for old tasks. Invite/hire creation checks the cutoff before writing but does not yet have the same transaction guard as ordinary bids, so a cutoff race remains. End-to-end wallet/refund/reopen behavior needs a safe integration test on a replica-set staging environment before release.
- Older release concerns remain unverified: photographed Android Google Sign-In `DEVELOPER_ERROR` likely requires matching the Play app-signing SHA-1 with the Android OAuth client for `com.taskhub.connect`; Apple sign-in source/config checks passed locally but real-device production sign-in/linking is not proven; Apple server-to-server notifications were left unconfigured; App Store Connect Age Assurance should be None if the app has no age-assurance mechanism. Last known reviewed iOS build was 1.0 (10).
- Earlier blog CMS work added public `/blog`, writer-restricted Markdown editor, media upload/embedding, autosaved private drafts, and direct publishing. It was not deployed or end-to-end tested. Web blog/admin design baseline still needs a user decision because `#6B46C1` and `#6C3BFF` coexist.

## Next session starts with

1. Fix closed-task pagination on mobile and web, then transactionalize invite/hire creation at the bidding cutoff. Re-run all checks.
2. Test no-deadline, expired-zero-bid refund, expired-with-bid no-close, last-bid withdrawal, reopen with enough/insufficient wallet balance, and delete-closed flows on a safe MongoDB replica-set staging backend. Do not use real funds without explicit coordination.
3. Only after those checks, deploy backend and web changes, produce a new mobile build, and ask testers to exercise the prepared WhatsApp checklist.
4. Separately resolve Google OAuth signer configuration, real-device Apple sign-in, App Store age-rating metadata, and blog CMS deployment verification.

## Open questions

- Is a safe staging backend available for transaction and wallet lifecycle tests, or will a dedicated test database be required?
- Which Android distribution produced the photographed Google error: Play Store, internal sharing, EAS preview, or local debug build?
- Have the prior web/mobile/backend fixes and blog CMS been deployed, and has Apple sign-in succeeded on a real iPhone?
