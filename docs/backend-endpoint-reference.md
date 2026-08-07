# TaskHub — Screen → Backend Endpoint Reference

> **Last verified: 2026-08-07**, against `taskhub-app@main` and `task-hub-backend@main`.
> Every path below was read out of the backend's `routes/*.js` (as mounted in `index.js`) and the app's `lib/api/*` + `lib/auth/*`. **These are real paths, not guesses** — earlier revisions of this doc listed inferred RESTful paths, and most of them were wrong.
>
> Purpose: know exactly what is wired, what is one call away, and what genuinely needs backend work.

## Current state in one paragraph

**The full marketplace loop is closed for both roles**: post → bid → accept/pay → escrow → complete → rate → payout → withdraw, all against the real backend. Both roles have **real auth** (the purpose screen's hire/earn choice routes to role-typed login/signup; tasker signup is two-step because `tasker-register` requires ten fields). `dev-auth` is deleted. **Removed entirely (2026-08-06):** the AI Quick Post screen, the whole simulated voice flow, `TaskContext`, and `lib/api/ai.ts` — posting is manual-only, and `POST /api/ai/parse-task` is now dead backend code. Push registration is wired but **dormant** until `EXPO_PUBLIC_ONESIGNAL_APP_ID` is set; in the meantime **email is the notification channel** — nine marketplace events (bids, hire requests/responses, work started/review/completed, payout, withdrawal receipt) now mail via Resend alongside the in-app rows. What's left is Part 4 (needs backend) plus KYC's vendor SDK. Location search runs on the **external Geoapify API**; reverse geocoding falls back to the device geocoder when the key is unset.

### Conventions

- **Base URL:** `https://task-hub-backend.onrender.com` (override with `EXPO_PUBLIC_API_URL`) — `lib/config.ts`
- **Auth header:** `Authorization: Bearer <token>`, token in SecureStore — `lib/api/client.ts`
- **Response envelope:** `{ status: 'success' | 'error', message, ...data }` — `lib/api/types.ts`. Note the payload key is **inconsistent** across the backend (`task`, `tasks`, `data`, `reviews`, `conversation`…); `lib/api/*` types each one individually.
- **Account types:** `user` vs `tasker`. The split is by **route path**, not a role claim: `/api/tasks/user/tasks` vs `/api/tasks/tasker/tasks`, `/api/wallet/user/balance` vs `/api/wallet/tasker/balance`. Most tasker paths are guarded by `protectTasker` and will 401 for a user token.
- **Multipart:** task create (`images`), chat send (`attachments`, ≤5), profile picture, tasker previous work. Chat send is multipart **even for text-only** messages.
- **Data layer:** TanStack Query. Read paths go through hooks in `lib/api/queries.ts`; writes are `useMutation` + a `queryKeys` invalidation.

### Status legend

| Mark | Meaning |
|---|---|
| ✅ | Backend endpoint exists, bound in `lib/`, **and called by a screen** |
| 🟠 | Backend endpoint exists **and is bound in `lib/`**, but no screen calls it — *pure wiring, smallest possible task* |
| 🟡 | Backend endpoint exists but **nothing in `lib/` binds it** — needs an `lib/api` function + screen wiring |
| 🔴 | **No backend endpoint** — needs backend work before the screen can be real |
| 🌐 | External (Geoapify) — no TaskHub backend needed |

---

## Part 1 — Wired and working today ✅

### Auth — `/api/auth/*` (bound in `lib/auth/auth-api.ts`)

| Method | Path | Screen |
|---|---|---|
| POST | `/api/auth/user-register` | `create-account` |
| POST | `/api/auth/tasker-register` | `create-account` → `tasker-details` (all ten required fields in one call) |
| POST | `/api/auth/user-login` · `/api/auth/tasker-login` | `login-form` (role from the `type` param) |
| POST | `/api/auth/verify-email` | `otp` (type-aware; tasker lands on home, not purpose-selection) |
| POST | `/api/auth/resend-verification` | `otp` (Resend) |
| POST | `/api/auth/forgot-password` | `forgot-password` (type-aware — the reset code is per-collection) |
| POST | `/api/auth/reset-password` | `create-new-password` (type-aware) |
| POST | `/api/auth/google` | `login`, `login-form` |
| POST | `/api/auth/google/complete-signup` | `google-complete-signup` |
| GET | `/api/auth/user` · `/api/auth/tasker` | session bootstrap (`auth-context`) |
| PUT | `/api/auth/profile` | `edit-profile` |
| PUT | `/api/auth/profile-picture` | `edit-profile` (multipart) |
| POST | `/api/auth/change-password` | `change-password` (falls back to `set-password` on `no_password_set`) |
| POST | `/api/auth/set-password` | `change-password`, for Google-only accounts |
| PATCH | `/api/auth/interests` | `purpose-selection` |
| PUT | `/api/auth/user/location` | `location-confirm` |
| GET | `/api/auth/verification-status` | `settings` (both security rows) |
| GET | `/api/universities` | `location-university` |
| POST | `/api/auth/logout` | `auth-context.signOut` |
| PUT · DELETE | `/api/auth/{user,tasker}/notification-id` | `auth-context` (OneSignal id on sign-in / sign-out) — **dormant until `EXPO_PUBLIC_ONESIGNAL_APP_ID` is set + new native builds**. Backend's tasker PUT used to 500 on success; fixed 2026-08-07. |

> `forgot-password` now routes **straight to `create-new-password`** — the `/forgot-password-sent` interstitial is bypassed (it was a dead end with no code input). The screen file still exists and is unreachable.

### Tasks, taskers, bids

| Method | Path | Screen |
|---|---|---|
| GET | `/api/tasks/user/tasks?status=` | `(main)/tasks`, `(main)/home` |
| GET | `/api/tasks?…` | `useTasks` (public list) |
| GET | `/api/tasks/:id` | `task-details` (bids arrive embedded in `task.bids`) |
| POST | `/api/tasks` | `post-review` (multipart when images attached) |
| GET | `/api/tasks/:id/matches` | `task-details` (Matches tab) |
| POST | `/api/tasks/:id/rate` | `(main)/tasks` via `rate-tasker-modal` |
| PATCH | `/api/tasks/:id/status` | `task-details` (cancel) |
| POST | `/api/bids/invite` | `task-details` via `invite-to-bid-modal` |
| POST | `/api/bids/hire-request` | `task-details` |
| POST | `/api/bids` | `task-details` (tasker) — place bid / apply; amount only when `isBiddingEnabled` |
| PUT · DELETE | `/api/bids/:id` | `task-details` (tasker) + `(main)/tasks` — edit / withdraw |
| POST | `/api/bids/:id/hire-response` | `task-details` (tasker) + `(main)/tasks` — accept ≠ hired; client still pays |
| POST | `/api/wallet/withdraw` | `withdraw` (tasker; min ₦500, one open request at a time) |
| GET | `/api/taskers/nearby` | `(main)/home` carousel |
| GET | `/api/taskers/:id` | `tasker-profile` |
| GET | `/api/taskers/:id/reviews` | `tasker-profile` |
| GET | `/api/saved-taskers` | `saved-taskers`, `(main)/profile` |
| POST · DELETE | `/api/saved-taskers/:taskerId` | `tasker-profile`, `saved-taskers` |
| GET | `/api/categories` | `post-category`, `post-service` |
| POST | `/api/support` | `report-issue` |
| GET | `/api/bids/:id/payment-summary` | `task-agreement` |
| POST | `/api/bids/:id/accept` | `task-agreement` (was `task-details`) |
| GET | `/api/tasks/:id/completion-code` | `track-task` |
| GET | `/api/v1/kyc/verification-status` | `nin-verification` (Didit record detail) |
| GET | `/api/wallet/banks` | `bank-account` |
| GET · POST | `/api/wallet/tasker/bank-account` | `bank-account` |
| DELETE | `/api/tasks/:id` | `task-details` via `task-actions-modal` |

### Chat, notifications, wallet

| Method | Path | Screen |
|---|---|---|
| GET | `/api/chat/conversations` | `(main)/messages` |
| POST | `/api/chat/conversations` | `task-details` (opens a thread) |
| GET | `/api/chat/conversations/:id/messages` | `chat` |
| POST | `/api/chat/conversations/:id/messages` | `chat` (text + image attachments) |
| POST | `/api/chat/conversations/:id/read` | `chat` |
| GET | `/api/chat/notifications` | `(main)/messages` (unread badge) |
| GET | `/api/notifications` | `notifications`, `(main)/home` |
| PATCH | `/api/notifications/:id/read` · `/read-all` | `notifications` |
| GET | `/api/wallet/user/balance` | `wallet` |
| GET | `/api/wallet/user/transactions?page=&limit=&purpose=` | `wallet` (recent), `transaction-history` (paged + filters) |
| GET | `/api/tasks?status=open` | `(main)/discover` |
| GET | `/api/tasks/user/reviews` | `my-reviews` ("About you") |
| POST | `/api/wallet/fund/initialize` | `wallet` via `fund-wallet-modal` |
| GET | `/api/wallet/fund/verify?reference=` | `wallet` (after checkout returns) |

---

## Part 2 — Bound in `lib/` but no screen calls it 🟠

| Binding | Endpoint | Should be used by |
|---|---|---|
| ~~`useReviewsAboutMe`~~ | `GET /api/tasks/user/reviews` | ✅ **wired** — `my-reviews` "About you" |
| ~~`getWalletTransactions`~~ | `GET /api/wallet/user/transactions` | ✅ **wired** — `transaction-history`, paged + `?purpose=` filters |
| ~~`useTasks`~~ | `GET /api/tasks?status=open` | ✅ **wired** — `(main)/discover` |
| `deleteNotification` | `DELETE /api/notifications/:id` | `notifications` (swipe-to-delete) |
| `rateClient` | `POST /api/tasks/:id/rate-client` | no tasker rating UI yet — the tasker never rates the client back |
| ~~`loginTasker` / `registerTasker`~~ | `/api/auth/tasker-{login,register}` | ✅ **wired (2026-08-06)** — role-typed `login-form` / two-step `create-account` → `tasker-details`. `dev-auth.ts` deleted; "Switch to Tasker mode" is now a real sign-out → sign-in. Google *signup* for taskers is deliberately blocked (complete-signup collects user fields only); Google sign-in works. |
| ~~`createBid`~~ | `POST /api/bids` | ✅ **wired (2026-08-07)** — place-bid sheet on `task-details` (tasker); state derived from the tasker's own pending bids |
| ~~`requestWithdrawal`~~ | `POST /api/wallet/withdraw` | ✅ **wired (2026-08-07)** — `/withdraw` screen. PIN deliberately not collected (server never checks it); `stellar_crypto` not surfaced. |
| `updateTaskerLocation` | `PUT /api/auth/location` | bound; no service-area screen (the feed's 200-mile radius keys off it) |
| `initiateNinKyc` | `POST /api/v1/nin/verify-nin` | **intentionally uncalled** — needs the QoreID SDK, and calling it creates an orphaned `pending` record (§3.2) |
| `reportKycFailure` | `POST /api/v1/nin/kyc-failure` | pairs with the above; only meaningful once the SDK can abandon a session |
| `registerDiditSession` | `POST /api/v1/kyc/register-session` | needs a Didit `sessionId` the app has no way to obtain yet (§3.2) |
| `setupTransactionPin` | `POST /api/wallet/tasker/pin/setup` | deliberately uncalled — the stored PIN is enforced nowhere (§3.4) |
| `getStellarDepositInfo` | `GET /api/wallet/stellar/deposit-info` | no screen surfaces the XLM deposit address |

### Follow-ups left behind by that wiring

| Item | Where | Why it's still open |
|---|---|---|
| Bid counts on the public task list | `(main)/discover` | `attachBidSummary` runs only on the user/tasker lists, so `GET /api/tasks` returns no `bidCount`. The card's bid line is omitted rather than shown as `0 Bids`. **One-line backend fix.** |
| Task text search | `(main)/discover` | No `q`/search param on `GET /api/tasks` — filtering is client-side over the fetched page (limit 50). |
| "Nearest First" / "Best Match" sort | `(main)/discover` | Removed from the sort sheet: no distance in the list payload, no server-side ranking. Only "Newest First" (server order) and "Highest Budget" (client re-sort) remain. |
| Advanced-filter sheet (distance/budget/category/urgency) | `(main)/discover` | Still inert — its Apply button only closes the sheet, as before this change. Distance needs geo the endpoint doesn't return. |
| "Failed"-only transaction filter | `transaction-history` | The backend validates `?purpose=` but has no `status` filter, so a failed-only view can't page correctly. Status shows per-row instead. **Small backend addition** if the filter is wanted. |
| "You gave" reviews | `my-reviews` | Genuinely no endpoint (Part 4) — the tab now shows an explanatory empty state instead of invented reviews. |

---

## Part 3 — Backend exists, app not wired 🟡 (the wiring backlog)

Ordered roughly by value. Each row needs a `lib/api/*` function plus screen wiring.

### 3.1 Account & security — ✅ done

| Screen | Endpoint(s) | Status |
|---|---|---|
| `change-password` | `POST /api/auth/change-password`, `POST /api/auth/set-password` | ✅ wired, with client-side validation (6-char min, confirm match, must differ) |
| `phone-number` | `PUT /api/auth/profile` | ✅ wired — reads the live `user.phoneNumber`, saves, then `refreshProfile()` |
| `purpose-selection` | `PATCH /api/auth/interests` | ✅ wired |
| `location-university` | `GET /api/universities` + `PUT /api/auth/profile` | ✅ wired — real list, persists the university **id** |
| `location-confirm` | `PUT /api/auth/user/location` | ✅ wired — keeps numeric coords and sends them with the resolved address |
| `settings` (verified badge) | `GET /api/auth/verification-status` | ✅ wired. Still worth surfacing on `(main)/home` and `(main)/profile`. |

**Decisions made while wiring these:**

- **Onboarding saves are non-blocking.** `purpose-selection`, `location-university`, and `location-confirm` persist on Continue but still advance if the request fails. These are personalization hints the user can change later, and dead-ending onboarding on a flaky connection is worse than a missing field. `change-password` and `phone-number` — where saving *is* the point — surface errors and stay put.
- **`purpose-selection` keys changed.** The screen used `local`; the backend enum (`ALLOWED_INTERESTS`) is `local_services`, and anything else is a 400. The card keys are now the backend slugs directly, typed as `Interest`.
- **`location-university` sends the university `_id`.** `PUT /api/auth/profile` accepts an id *or* an exact name and 400s on "University not found or inactive" — so the hardcoded display names it used before (e.g. "University of Lagos (UNILAG)") would have been rejected outright.
- **"Verify & Save" on `phone-number` is now just "Save".** There is no phone-verification endpoint anywhere in the backend — only email OTP — so the old label promised a step that never ran.
- **Both `settings` security rows read one flag.** `GET /api/auth/verification-status` returns a single `isVerified` (`isKYCVerified` for users, `verifyIdentity` for taskers). The design implies independent "Face" and "NIN" statuses; showing the same value on both is the truthful option until the backend exposes per-method state. **Open question for the backend.**
- **`change-password` handles Google-only accounts.** The backend answers 400 + `code: 'no_password_set'` when the account has no password; the screen transparently retries via `set-password`. `ApiError` gained `.code` and `.isNoPasswordSet` for this.

### 3.2 Identity verification — ⚠️ partially done; blocked on a vendor SDK

> **Correction to an earlier revision of this doc.** §3.2 was listed as 🟡 "endpoint exists, needs a binding + screen wiring". That was wrong. Wiring is necessary but **not sufficient**: neither provider accepts identity data from our own UI, and **neither SDK is installed in this app**. Verification can be *observed* from the app today, but not *completed*.

| Screen | Status |
|---|---|
| `nin-verification` | ✅ shows real status (verified / in review / rejected + reasons); ❌ cannot start a verification |
| `select-verification` | ✅ shows a verified banner from real status; copy now honest about unsupported methods |
| `lib/api/kyc.ts` | ✅ all four endpoints bound and documented |

**Why it's blocked.** Both flows expect a third-party SDK to capture the ID document and selfie:

- **QoreID** — `POST /api/v1/nin/verify-nin` **does not take a NIN**. It opens a session and returns `{ accessToken, clientId, clientReference, flowId }` for the QoreID *frontend SDK*, which performs the capture; QoreID then webhooks the backend, which flips the account flag. The screen previously collected an 11-digit NIN and faked success on a `setTimeout` — there was never anywhere to send that number.
- **Didit** — `POST /api/v1/kyc/register-session` takes a `sessionId` the app is expected to *already have* from Didit's SDK or hosted flow. Our backend has no "create session" endpoint.

**To unblock:** integrate one vendor SDK (native module + Expo config plugin → dev-client rebuild), then call `initiateNinKyc()` and hand its credentials to the SDK, reporting abandonment via `reportKycFailure(clientReference, reason)`.

**Decisions made:**

- **`initiateNinKyc` is bound but deliberately never called.** It has a real side effect — it upserts a `pending` KYCVerification row that surfaces on the admin dashboard. Calling it without an SDK to continue would leave orphaned pending records for admins to chase.
- **The NIN input is gone.** Collecting a number with no endpoint to accept it, then simulating success, was the single most misleading thing in the app: it told users they were verified when nothing had happened.
- **Two status endpoints, and they are not interchangeable.** `GET /api/auth/verification-status` reads the account flag and is provider-agnostic — **this is the source of truth**. `GET /api/v1/kyc/verification-status` filters on `provider: 'didit'`, so a QoreID-verified account reads back as `Not Started`; it also uses a `{ success, data }` envelope instead of the API-wide `{ status, ... }`. It's bound for rejection reasons and masked NIN only.
- **Duplicate NIN route resolved on our side.** `POST /api/nin/submit-nin` and `POST /api/v1/nin/verify-nin` share one controller; the binding uses the `/api/v1/nin` pair so it sits with `kyc-failure`. **The backend should still delete one of them.**
- **Passport / Driver's Licence / NIN Slip have no backend at all.** The rows now say so instead of "not available in this demo".

### 3.3 Task lifecycle — ✅ done

| Screen | Endpoint(s) | Status |
|---|---|---|
| `task-agreement` | `GET /api/bids/:id/payment-summary` → `POST /api/bids/:id/accept` | ✅ rewritten as confirm-and-pay |
| `track-task` | `GET /api/tasks/:id`, `GET /api/tasks/:id/completion-code`, `PATCH /api/tasks/:id/status`, `POST /api/tasks/:id/rate` | ✅ wired (client side) |
| `choose-existing-task` | `GET /api/tasks/user/tasks?status=open` + `POST /api/bids/invite` | ✅ wired |
| `task-actions-modal` | `DELETE /api/tasks/:id` | ✅ Delete wired; Edit/Boost have no backend (below) |
| `task-details` (Bids tab) | `task.bids` from `GET /api/tasks/:id` | unchanged — the embedded list is sufficient; `GET /api/bids/task/:taskId` stays unused |

**The backend's actual hire and completion model** — worth reading before touching these screens again:

- **Accept = pay = assign, in one atomic call.** `POST /api/bids/:id/accept` validates, debits the wallet for bid + platform fee, holds it in escrow, and assigns the task. There is **no "send agreement" endpoint and no separate payment step** — the old `task-agreement` flow (Send Agreement → Confirmed → Payment → Processing → Success → Hired, all on `setTimeout`) described a backend that does not exist.
- **The poster cannot complete a task.** `PATCH /api/tasks/:id/status` permits the owner exactly one transition: `→ cancelled`. Completion is: the tasker moves `assigned → in-progress` (backend generates a 6-digit code and notifies the poster) → the poster reads the code via `GET /api/tasks/:id/completion-code` and hands it over → the **tasker** submits it via `PATCH /api/tasks/:id/status/tasker`, which releases escrow. The old "Confirm Completion → Release Payment & Complete" button was fiction.
- **Cancelling refunds escrow** from both `assigned` and `in-progress` (two separate branches in `changeTaskStatus`, both creating an `escrow_refund` transaction).
- **Delete is refused** once a task is `in-progress` or `completed` — cancel those instead.

**Decisions made while wiring these:**

- **The accept path now goes through `task-agreement`.** ⚠️ *User-visible flow change.* Previously, "Confirm & Pay" in the `ready-to-hire` modal called `acceptBid` immediately — a one-tap wallet debit with no fee breakdown shown. It now opens `task-agreement?bidId=…`, which renders the **server-computed** summary (task amount, platform fee, total, live wallet balance, `sufficientBalance`) and pays from there. The fee is never re-derived client-side. Say the word and I'll restore one-tap.
- **Insufficient balance is handled before the call**, not after: the summary's `sufficientBalance` swaps the Pay button for "Fund Wallet" and shows the shortfall, instead of relying on a 402 round-trip.
- **`track-task`'s timeline is derived, not stored.** The backend keeps no per-step history — only `status`, `createdAt`, `completedAt`, `updatedAt` — so steps show as reached/current/future and only genuine timestamps carry a time. The design's "Tasker On the Way" step has no backend equivalent and was dropped rather than invented.
- **`track-task` now shows the completion code** while the task is in progress, with an explanation that handing it over releases payment. That is the poster's real action; "Confirm Completion" is gone.
- **`saved-taskers` → hire was a dead end.** It opened `task-agreement` with a tasker name and no task or bid. It now routes to `choose-existing-task` with the tasker id, which lists the user's real open tasks and sends `POST /api/bids/invite`.
- **Edit and Boost now tell the truth.** Boost has no backend at all (it previously claimed "Task boosted successfully!"); editing a posted task has an endpoint (`PUT /api/tasks/:id`) but no edit screen, so the action explains that rather than opening a placeholder. **Building an edit screen is the open follow-up here.**
- **The tasker half of `track-task` is untouched** — "Nudge Customer", "Update Status", the status sheet — and remains mock. `PATCH /api/tasks/:id/status/tasker` exists but belongs to the §3.6 tasker milestone.

### 3.4 Wallet & payouts (tasker-scoped) — ✅ done

| Screen | Endpoint(s) | Status |
|---|---|---|
| `bank-account` | `GET /api/wallet/banks`, `GET`/`POST /api/wallet/tasker/bank-account` | ✅ wired |
| withdrawal (no screen yet) | `POST /api/wallet/withdraw`, `POST /api/wallet/tasker/pin/setup` | bound in `lib/api/wallet.ts`, no UI — see below |
| — | `GET /api/wallet/stellar/deposit-info` | bound, no UI |

> **Correction to an earlier revision.** That revision said `bank-account` "is currently pushed from the **client** profile menu" and asked where the screen belongs. That was wrong — the row lives in `TASKER_MENU_GROUP_EARNINGS`, which renders only when `accountType === 'tasker'`. It was already correctly gated, so there was no product decision to make. The screen now also handles a direct link from a client account with an explanatory state.

**The scoping question resolved itself in the data model.** Withdrawals are tasker-only end to end: `Withdrawal.tasker`, `Tasker.bankAccount`, and every controller resolves `Tasker.findById(...)`. There is no user-side bank account anywhere in the backend — client money flows in (funding) and into escrow, with refunds returning to the wallet. A client hitting these endpoints gets a **404, not a 401**, because the wallet router is `protectAny`.

**Three things the mock got structurally wrong**, now fixed:

1. **One account, not a list.** `Tasker.bankAccount` is a single embedded object — saving replaces it, and there is **no delete endpoint**. The screen kept an array with add/remove; it now shows the one account and offers "Replace bank account".
2. **The account name is not entered by the user.** `POST /api/wallet/tasker/bank-account` takes only `{ accountNumber, bankCode }` and resolves the name with the payment gateway. That resolution *is* the validation — the old free-text "Account name" field could have saved a name that didn't match the account.
3. **Banks must come from the API.** Saving needs the bank `code`; the hardcoded list of seven display names could never supply one.

**Open items:**

- ✅ **Withdrawal screen built (2026-08-07).** `/withdraw` — balance, saved payout account (routes to `/bank-account` when absent), amount validated against the server's rules, and the one-open-request constraint surfaced up front. Success copy states the real mechanics: wallet debited immediately, money moves on admin approval. A withdrawal-request receipt email now goes out too.
- 🔴 **The transaction PIN is still not enforced.** `POST /api/wallet/tasker/pin/setup` hashes and stores `transactionPin`, but it is **read nowhere in the backend** and `requestWithdrawal` never asks for it — a bearer token alone authorizes a payout request. The withdrawal screen therefore deliberately collects no PIN. To make it real: enforce it in `requestWithdrawal`, then add a PIN-setup screen and a PIN field.

### 3.5 Support — ✅ done

| Screen | Endpoint | Status |
|---|---|---|
| `report-issue` | `POST /api/support` | ✅ wired |

**What the endpoint actually is.** `POST /api/support` takes exactly `{ name, email, message }`, is unauthenticated, and **persists nothing** — it validates, renders an HTML email, and sends it to `support@ngtaskhub.com`. There is no ticket id to show the user and no way to read a report back. Consequences:

- **Structure has to go into the free text.** The issue category and any task reference are folded into `message` by `buildIssueReportMessage` (`lib/api/support.ts`), because the endpoint has no fields for them. A support agent otherwise receives prose with no idea which task it concerns.
- **Reports now carry task context.** `report-issue` accepts optional `taskId`/`taskTitle` params, and the three report entry points on `task-details` pass them. The screen shows the user what it's attaching.
- **The other entry points stay generic.** `settings`, `help-support`, `chat`, and `track-task` also open `report-issue`, but have no task in scope — `chat` knows only a conversation id, and `track-task` takes no params at all (it's still mock). Worth revisiting when §3.3 gives `track-task` a real task.
- **Name and email come from the session**, since the endpoint reads them from the body rather than the token. If the profile has neither, the screen says so rather than sending a request the backend will 400.
- **`report-submitted` promises more than the backend delivers** — it's a static confirmation. There's no ticket reference to display, and nothing to poll.

### 3.6 Tasker-mode surfaces — ✅ wired

| Screen | Endpoint(s) | Status |
|---|---|---|
| `(main)/home` (tasker) | `GET /api/wallet/tasker/{balance,transactions}`, `/api/tasks/tasker/feed`, `/api/tasks/tasker/tasks`, `/api/bids/tasker/bids`, `/api/auth/verification-status` | ✅ wired |
| `(main)/tasks` (tasker) | `GET /api/tasks/tasker/tasks` + `GET /api/bids/tasker/bids`; `POST /api/bids/:id/hire-response`, `PUT`/`DELETE /api/bids/:id`, `PATCH /api/tasks/:id/status/tasker` | ✅ wired |
| `track-task` (tasker half) | `PATCH /api/tasks/:id/status/tasker` (start + complete) | ✅ wired |
| `tasker-services` | `GET /api/categories` → `PUT /api/auth/categories` | ✅ wired |
| `tasker-portfolio` | `POST`/`DELETE /api/auth/previous-work` | ✅ wired |
| `wallet`, `transaction-history` (tasker) | `GET /api/wallet/tasker/{balance,transactions}` | ✅ wired |
| `performance` | derived from tasker tasks/bids/transactions | ⚠️ no analytics endpoint — see below |

**Decisions made while wiring these:**

- **User and tasker wallet endpoints are not interchangeable.** `GET /api/wallet/user/balance` resolves a `User` by id, so a tasker token gets a **404, not a 401**. `wallet` and `transaction-history` now pick the endpoint pair by `accountType` and disable the other; previously a tasker opening the wallet screen just saw an error. The tasker list has no `?purpose=` filter, so the filter control is hidden rather than shown and ignored.
- **Accepting a hire request is not being hired.** `POST /api/bids/:id/hire-response` sets `taskerConfirmed` and posts a system message asking the client to pay — the task is only assigned when the client calls `POST /api/bids/:id/accept`. The success copy says the job becomes active once payment completes, instead of the old "is now in your Active Jobs".
- **The completion sheet now collects the code.** The old flow was "Request completion → the customer confirms", which no endpoint implements. The tasker submits the client's 6-digit code to `PATCH /api/tasks/:id/status/tasker`, and *that* releases escrow. Both the jobs list and `track-task` do this.
- **There is no "waiting for the customer to fund escrow" state.** Assignment and escrow funding are the same atomic call, so any task a tasker can see is already funded. `track-task`'s local `escrowStatus`/`taskStatusStep` state is gone — both are derived from `task.status` — and the "Nudge Customer" button and its "Reminder Sent" modal were removed along with it (no nudge endpoint exists; chat is the real channel).
- **The portfolio is a gallery, not a project list.** `Tasker.previousWork` is an array of `{ url, publicId }` and `POST /api/auth/previous-work` accepts only files — there is no title, description or link field. The screen's "Project Title" and "Portfolio (Link)" inputs had nowhere to save, so it is now an upload/delete grid with the backend's real 10-image cap.
- **`tasker-services` is a prerequisite, not a preference.** `GET /api/tasks/tasker/feed` filters on the tasker's `subCategories`; with none set it returns 200 and an empty list. The home feed's empty state routes there rather than claiming there's no work. The screen's two-step main → sub flow maps directly onto `groupCategories`, and it prefills from the tasker's current selection.
- 🔴 **`performance` has no analytics endpoint.** Jobs completed, completion rate, bids won, average rating and the earnings chart are all derived client-side from the tasker's tasks, bids and transactions — correct, but truncated by those lists' paging on long histories. **Response time, profile views, repeat customers and invitation rate were removed**: nothing in the backend records them, and they were fixed strings. The "Insights" card was removed for the same reason.

**All three former gaps closed (2026-08-06/07):**

- ✅ `POST /api/bids` — place-bid sheet on `task-details` (tasker branch rewritten from mock fixtures to the real task + own-bid state; the fake in-progress timeline and Request Completion/Nudge flows were removed — start/complete live in the Jobs tab).
- ✅ Withdrawal screen (§3.4).
- ✅ Tasker auth screens (§ Part 2). `dev-auth.ts` is deleted from the codebase.

### 3.7 Push / presence

| Concern | Endpoint | Notes |
|---|---|---|
| OneSignal device id | `PUT /api/auth/{user,tasker}/notification-id`, `DELETE` same | ✅ Wired (2026-08-07): `lib/push.ts` + `auth-context` register on sign-in, detach on sign-out, deep-link taps. **Dormant** until `EXPO_PUBLIC_ONESIGNAL_APP_ID` is set (`.env` + EAS env) and new native builds ship; OneSignal dashboard still needs FCM creds (Android) + APNs key (iOS). Flip the plugin `mode` to `production` before store builds. |
| **Email notifications** | via Resend (`RESEND_API_KEY`) | **The active channel while push is dormant.** 2026-08-07: nine events added — poster: new bid, hire response (Payment Required / declined), work started, ready-for-review, completed; tasker: hire request, invite, payout, withdrawal receipt. Pre-existing: new matching task, bid accepted/rejected, task cancelled, withdrawal rejected/completed, KYC, OTP. Chat and self-initiated events stay in-app only. |
| Web push | `GET /api/push/vapid-public-key`, `POST /api/push/{subscribe,unsubscribe}` | Web-only; not applicable to the native app. |
| Chat presence | `PATCH /api/chat/presence` | Would drive online dots in `messages` / `chat`. |

---

## Part 4 — No backend endpoint exists 🔴

These need backend work first. Everything else in this doc does not.

| Feature | Screen(s) | Note |
|---|---|---|
| **Blocked users** | `blocked-users` | No model, no routes. Needs block/unblock/list + enforcement in chat and task matching. |
| **Device sessions** | `device-sessions` | No session registry — JWTs are stateless. Needs a sessions collection to list/revoke. |
| **Notification preferences** | `settings` toggles | Only device-id registration exists; no per-category preference storage. |
| **"You gave" reviews** | `my-reviews` | Ratings are written onto the task (`POST /api/tasks/:id/rate`); there's no "reviews authored by me" list endpoint. |
| **Receipts** | `receipt` | No receipt or PDF endpoint. `GET /api/bids/:id/payment-summary` is the closest existing data. |
| **Boost / promote a task** | `task-actions-modal` | Not modelled at all. |
| **Profile stats** | `(main)/profile` | Posted/reviews/saved counts have no aggregate endpoint (saved count is derivable from `/api/saved-taskers`). |
| **Services within a category** | `post-service` | Backend exposes `/api/categories` and `/api/main-categories` only — there's no third "services" level. The screen's two-step category→service model may need flattening instead of a new endpoint. |

---

## Part 5 — Screen-by-screen index

**Data-source key:** `api` = real backend · `draft ctx` = `PostTaskContext` · `ctx:Loc` = `LocationContext` (AsyncStorage) · `mock` = hardcoded in-file · `params` = passed via route params · `static` = no data · `geo` = Geoapify.

### Auth & onboarding
| Route | Data now | Gap |
|---|---|---|
| `/splash`, `/onboarding`, `/success` | static | none |
| `/purpose` | static | hire/earn choice becomes the `type` param for the whole auth stack (dev-auth removed) |
| `/purpose-selection` | api ✅ | saves interests; non-blocking on failure; users only (taskers skip it) |
| `/login` | api ✅ | role-typed; Google wired (tasker signup via Google intentionally blocked); Apple is "Coming soon" |
| `/login-form` | api ✅ | role-typed — picks `user-login` vs `tasker-login` |
| `/create-account` | api ✅ | role-typed; tasker mode collects first/last name and continues to `/tasker-details` |
| `/tasker-details` | api ✅ | tasker signup step 2 — the remaining `tasker-register` fields, one atomic call |
| `/country-selection` | static | none (Ghana dropped; Nigeria only) |
| `/phone-number` | api ✅ | shows the live number; no phone-verification endpoint exists |
| `/otp` | api ✅ | 5-digit codes, matches backend |
| `/google-complete-signup` | api ✅ | — |

### Password & verification
| Route | Data now | Gap |
|---|---|---|
| `/forgot-password` | api ✅ | — |
| `/forgot-password-sent` | static | **unreachable** — candidate for deletion |
| `/create-new-password` | api ✅ | — |
| `/reset-success`, `/change-password-success` | static | none |
| `/change-password` | api ✅ | falls back to `set-password` for Google-only accounts |
| `/select-verification` | api ✅ | shows verified banner; other methods have no backend |
| `/nin-verification` | api ✅ (read-only) | real status; **cannot start verification** — needs a vendor SDK (§3.2) |

### Main tabs
| Route | Data now | Gap |
|---|---|---|
| `/(main)/home` | api ✅ + ctx:Loc | — |
| `/(main)/tasks` | api ✅ | — |
| `/(main)/messages` | api ✅ | — |
| `/(main)/profile` | api ✅ (partial) | 🔴 stats counts; mode switch is now a real sign-out → role-typed login |
| `/(main)/discover` | api ✅ | search/pills/sort applied client-side — see Part 2 follow-ups |

### Post / hire flow

> The AI Quick Post (`/post`) and the whole voice flow (`voice-post`, `voice-recording`, `voice-organizing`, `voice-understanding`, `voice-confirm`, `review-task`) were **deleted 2026-08-06**, along with `TaskContext`. Every entry point resets the draft via `useNewPost()` and lands on `/post-category`.

| Route | Data now | Gap |
|---|---|---|
| `/post-category`, `/post-service` | api ✅ | 🔴 no true "services" level |
| `/post-details` | draft ctx | none (PostTaskContext draft state) |
| `/post-review` | api ✅ | creates the task — the only create path now |
| `/post-success` | static | none |
| `/choose-existing-task` | api ✅ | real open tasks → `POST /api/bids/invite` |

### Task management
| Route | Data now | Gap |
|---|---|---|
| `/task-details` | api ✅ | tasker branch rewritten 2026-08-07: real task data, place/edit/withdraw bid, accept/decline invitations. 🟡 poster-side task edit still has no screen |
| `/task-agreement` | api ✅ | confirm-and-pay: server-computed summary → `acceptBid` |
| `/track-task` | api ✅ (client side) | real timeline, completion code, cancel; tasker half still mock (§3.6) |
| `/tasker-profile` | api ✅ | — |
| `/saved-taskers` | api ✅ | — |
| `/receipt` | params + mockup values | 🔴 no receipt endpoint |

### Wallet, chat, notifications
| Route | Data now | Gap |
|---|---|---|
| `/wallet` | api ✅ | tasker balance card now has a Withdraw button |
| `/withdraw` | api ✅ | tasker payout request; PIN deliberately omitted (unenforced server-side) |
| `/transaction-history` | api ✅ | paged + server-side `?purpose=` filters |
| `/bank-account` | api ✅ | tasker-only; one account, gateway-resolved name |
| `/chat` | api ✅ + geo | 🟡 presence |
| `/notifications` | api ✅ | 🟠 delete |
| `/notification-details` | params | none needed |

### Settings, support, security
| Route | Data now | Gap |
|---|---|---|
| `/settings` | api ✅ (partial) | verification wired; 🔴 notification prefs still local state |
| `/edit-profile` | api ✅ | — |
| `/my-reviews` | api ✅ ("About you") | 🔴 "You gave" has no endpoint — shows an empty state |
| `/help-support` | static | 🔴 optional dynamic FAQ/contact |
| `/report-issue` | api ✅ | sends the report; carries task context from `task-details` |
| `/report-submitted` | static | none |
| `/blocked-users` | mock | 🔴 no backend |
| `/device-sessions` | mock | 🔴 no backend |
| `/tasker-services` | api ✅ | real categories → `PUT /api/auth/categories`; gates the tasker feed |
| `/tasker-portfolio` | api ✅ | upload/delete grid over `previousWork` (max 10) |
| `/performance` | api ⚠️ | derived from tasks/bids/transactions; no analytics endpoint (§3.6) |

### Location (🌐 Geoapify)

> Since 2026-08-06 reverse geocoding no longer requires the Geoapify key: `lib/location/geocoding.ts` falls back to the device's native geocoder, and stored raw "lat, lon" strings self-migrate to place names on read. Search/autocomplete and map tiles still need `EXPO_PUBLIC_GEOAPIFY_API_KEY`.

| Route | Data now | Gap |
|---|---|---|
| `/location-permission` | static | none (expo-location) |
| `/location-confirm` | geo + api ✅ | persists coords + address |
| `/location-map` | geo | hands coords to `/location-confirm`, which saves |
| `/location-selector-modal` | geo + ctx:Loc | optional persist |
| `/location-university` | api ✅ | real list; saves the university id |

---

## Part 6 — Notes

1. ~~`lib/auth/dev-auth.ts` is a shipping hazard.~~ **Resolved 2026-08-07** — deleted outright; real tasker auth replaced both call sites, and the old mode switch's token-reuse bug (a user JWT re-labeled as a tasker session, 401ing everywhere) went with it.
2. ~~`TaskContext` is a parallel source of truth.~~ **Resolved 2026-08-06** — deleted with the voice flow. `PostTaskContext` (draft-only) is the sole post-flow state.
3. ~~Two task-creation paths exist.~~ **Resolved 2026-08-06** — `post-review` → `createTask` is the only path; the AsyncStorage-only voice path is gone.
4. **Duplicate NIN routes.** `POST /api/nin/submit-nin` and `POST /api/v1/nin/verify-nin` both call `initiateQoreIdKyc`. Pick one before binding, or the app will encode the ambiguity.
5. **Two verification-status routes.** `GET /api/auth/verification-status` and `GET /api/v1/kyc/verification-status`. Same question.
6. **Unmounted backend routes.** `routes/taskerRoute.js` and `routes/adminRoute.js` exist but are not mounted in `index.js` — don't bind against them.
6b. **`GET /api/tasks?categories=` is broken.** `getAllTasks` sets `filterOptions.categories`, but the Task model has `mainCategory` / `subCategory` / `subCategories` and **no `categories` field** — so passing the param matches zero documents. Should be `mainCategory` (or `$in` over `subCategories`). Until it's fixed, category filtering must stay client-side.
7. **Response-envelope drift.** The backend returns payloads under `task`, `tasks`, `data`, `reviews`, `conversation`, `message`… depending on the route. `lib/api/*` types each individually; keep doing that rather than assuming a shared shape.
8. **What's actually left** (2026-08-07): (a) `POST /api/ai/parse-task` + `OPENAI_API_KEY` are dead since the AI removal — delete server-side; (b) §3.2 KYC needs the QoreID SDK (the one genuinely blocked item); (c) enforce-or-drop the transaction PIN (§3.4); (d) push activation is config-only — set `EXPO_PUBLIC_ONESIGNAL_APP_ID`, load FCM/APNs creds into OneSignal, rebuild; (e) Part 4 backend-first features (blocked users, device sessions, notification prefs, receipts, boost, "You gave" reviews, profile stats); (f) smaller follow-ups: poster-side task edit screen, tasker-rates-client UI, service-area screen, chat presence.
