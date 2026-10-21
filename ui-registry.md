# UI Pattern Registry

### Saved Tasker Heart Feedback

File: `app/tasker-profile.tsx`
Last updated: 2026-10-12

| Property | Standard |
| --- | --- |
| Touch target | 44 by 44 points around the existing heart icon |
| Brand accent | `COLORS.brand` (`#6c3bff`) for compact success sparkles |
| Press state | 0.97 scale over 120 ms, omitted with reduced motion |
| Pending state | 0.5 opacity, disabled to prevent duplicate save requests |

**Pattern notes:** The heart reflects optimistic saved state while the request runs. A brief six-dot burst and success haptic occur only after saving succeeds. Unsave has no celebration; request failures roll back and show an alert.

## Browse Taskers and Task Cancellation — Established 2026-10-12

- Tasker directory cards show coarse `city, state` only. Do not display the user-entered `area` or address.
- Directory results are paginated with a single explicit "Load more taskers" action. Preserve loaded cards if a later page fails, and allow retry.
- Cancellation uses a centered, scrollable modal with selectable reason rows. The "Others" choice reveals a multiline text field and disables confirmation until a non-blank reason is entered. Keep the draft visible on network failure.
- Optional task deadlines show a prominent, accessible "Remove deadline" text button only when a date is selected, both while posting and editing.

### Cancelled task history card

File: `app/(main)/tasks.tsx`
Last updated: 2026-10-12

| Property | Standard |
| --- | --- |
| Background | `COLORS.surface` (`#ffffff`) |
| Border | `1px #e0e0ea` |
| Radius | `16` |
| Primary text | `COLORS.textPrimary`, Geist SemiBold, 15 |
| Secondary text | `COLORS.textSecondary`, Geist Regular, 13 |
| Spacing | Padding 16, gap 8 |
| Status accent | Pale red `#fff1f1` with `COLORS.error` text |

**Pattern notes:** Show the saved cancellation reason in selectable text; use "No reason provided" only for older records without one. The task opens its detail screen when pressed. The five user-history tabs remain visible on narrow devices by using compact labels.

## Baseline — Established 2026-06-14

*Note: This baseline was established via `/imprint audit`*

| Property | Correct Standard | Purpose / Notes |
| :--- | :--- | :--- |
| **Card background** | `#ffffff` (`COLORS.surface`) | Card items, lists, and sheets |
| **Canvas background** | `#f9f9fb` (`COLORS.canvas`) | Screen backdrop |
| **Sunken background** | `#f2f2f7` (`COLORS.sunken`) | Inactive inputs, nav background |
| **Brand Primary** | `#6c3bff` (`COLORS.brand` / `primary`) | Interactive brand items, buttons |
| **Brand Strong** | `#4621c0` (`COLORS.brandStrong`) | Focused/pressed buttons and active items |
| **Pill Background** | `#f3eeff` (`COLORS.pillBg`) | Custom badges and category tags |
| **Text Primary** | `#111122` (`COLORS.textPrimary`) | Standard heading and body text |
| **Text Secondary** | `#5a5a70` (`COLORS.textSecondary`) | Descriptors, placeholder, subtitle |
| **Card border radius** | `borderRadius: 16` | Standard content card rounding |
| **Modal border radius**| `borderRadius: 24` | Bottom sheets and modal wrappers |
| **Button border radius**| `borderRadius: 12` | Standard buttons (height `48`) |
| **Form Input radius** | `borderRadius: 8` | Text fields (height `48` or textarea) |
| **Layout Spacing** | `paddingHorizontal: 16` | Standard screen scroll layout spacing |

**Interactive states**:
- Tap feedback: Opacity drops to `0.9` (`pressed && styles.pressed`).
- Disabled status: Opacity drops to `0.5` (`disabled && styles.disabled`).

---

## Bottom-Sheet Modal Guidelines

Bottom-sheet modals are rendered using the React Native native `<Modal>` component with transparent overlay backdrops.

### Standard Structure

```tsx
<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
  <Pressable style={styles.backdrop} onPress={onClose}>
    {/* Inner Pressable has an empty callback to block backdrop click propagation */}
    <Pressable style={[styles.sheet, { marginBottom: insets.bottom + 16 }]} onPress={() => {}}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>
        {/* Content list or button views */}
      </View>
    </Pressable>
  </Pressable>
</Modal>
```

### Pattern Notes:
- **Backdrop**: Flex container aligned to `'flex-end'` with background color `rgba(17, 17, 34, 0.4)` (`COLORS.backdrop`). Left and right side margins should use `paddingHorizontal: 16`.
- **Sheet**: Rendered with background `#ffffff`, `borderRadius: 24` (`MODAL_RADIUS`), and `paddingHorizontal: 16`, `paddingVertical: 24`.
- **Close Gesture**: Tapping outside the sheet (the backdrop overlay) must trigger `onClose`.
- **Interaction Prevention**: The inner sheet container must wrap its content inside an empty `Pressable` wrapper `onPress={() => {}}` to prevent sheet taps from bubbling up and closing the overlay.

---

## Parity Screens — Established 2026-09-16

- Security, preferences, analytics, payout, support, and receipt screens retain the baseline canvas/surface hierarchy and `16px` screen gutter.
- Destructive account/session actions use `#fff1f1` surfaces with `#b01515` text; they require explicit confirmation and never optimistically imply success.
- Server-authoritative detail cards use `16px` radius and a `1px #e0e0ea` border. Compact selectable methods use `12px` radius; selected methods switch to `#f3eeff` with a `#6c3bff` border.
- Async screens provide centered loading, explicit empty/error copy, and a brand-colored retry action. Financial actions remain disabled while pending.
- Financial summary cards use the brand surface with white primary values; transaction breakdowns use white cards and subtle dividers.
- Settings groups use uppercase 12px section labels, white 16px cards, 32px icon tiles, and 12px vertical rows.

### Tasker Feed States

Files: `app/(main)/home.tsx`, `app/tasks-near-you.tsx`
Last updated: 2026-10-12

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` canvas and `#ffffff` cards |
| Border | `1px #e0e0ea` on task cards |
| Border radius | `16px` task cards and `12px` retry/actions |
| Text, primary | Geist 600 headings with `#111122` |
| Text, secondary | Geist 400 descriptions with `#5a5a70` |
| Spacing | `16px` screen gutter and task-card padding |
| Accent usage | `#6c3bff` for retry and service actions |

**Pattern notes:** A failed feed request gets a retry state, not a no-tasks state. Empty copy describes category matching without implying that location hides tasks.

## Destructive Identity Flows: Established 2026-09-17

- Permanent account deletion uses the existing danger surface and requires typed `DELETE` confirmation plus a native destructive confirmation alert.
- Deletion explains linked-role scope, retained de-identified financial records, and server-enforced blockers before the action.
- Backend blocker details remain visible in an amber 16px card so users can resolve each item without losing their entered confirmation state.
- Reauthentication accepts a password or launches fresh Google sign-in for Google-only accounts. The submit action stays pending until the complete linked identity deletion finishes.

### Identity and Provider Settings

Files: `app/connected-accounts.tsx`, `app/link-role-account.tsx`
Last updated: 2026-09-18

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` canvas and `#ffffff` cards |
| Border | `1px #e0e0ea` for identity cards and inputs |
| Border radius | `16px` cards, `12px` actions, `8px` inputs and icon tiles |
| Text, primary | Geist 600 headings with `#111122` |
| Text, secondary | Geist 400 descriptions with `#5a5a70` |
| Spacing | `16px` screen gutter, card padding, and major vertical gaps |
| Interactive state | Pressed opacity `0.9`, disabled opacity `0.5` |
| Accent usage | `#6c3bff` for Taskhub actions, `#0d6639` for connected status |

**Pattern notes:**

- Provider connections appear in one bordered settings card with 32px neutral icon tiles and subtle dividers.
- Apple authentication always uses the official native Apple button. Custom buttons are not substituted.
- Identity-linking screens state the verification rule before presenting credentials and explain that email matching alone is insufficient.

### Tasker Directory

File: `app/taskers.tsx`
Last updated: 2026-10-04

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` canvas, `#ffffff` cards, `#f2f2f7` search field |
| Border | `1px #e0e0ea` on tasker cards and unselected filters |
| Border radius | `16px` cards, `12px` filter actions, `8px` search and compact badges |
| Text, primary | Geist 600 headings and names with `#111122` |
| Text, secondary | Geist 400 descriptions and metadata with `#5a5a70` |
| Spacing | `16px` screen gutter and card padding, `12px` card content gaps |
| Interactive state | Pressed opacity `0.9`; selected filters use brand surface and border |
| Accent usage | `#6c3bff` for filters and actions, amber for ratings |

**Pattern notes:**

- Browse directories use a `FlatList` with search and filter controls in the list header.
- Data-backed directories always define loading, error, empty, content, cached refresh-error, and pull-to-refresh states.
- Tasker cards lead to the public profile and show only server-provided ratings, completed-task counts, location, and distance.
- Directory search uses the backend query before local category/sort filtering; the home carousel remains limited to six.

### Transaction Receipt

File: `app/receipt.tsx`
Last updated: 2026-10-04

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` canvas, `#ffffff` details card |
| Border | No card border; use spacing between rows |
| Border radius | `16px` card and status banner |
| Text, primary | Geist 700 amount with `#111122`, Geist 500 values |
| Text, secondary | Geist 400 labels and dates with `#5a5a70` |
| Spacing | `16px` screen gutter, card padding, and row gap |
| Interactive state | Copy reference button confirms copied state |
| Accent usage | Green for verified receipt banner; purple for actions |

**Pattern notes:**

- Receipt rows appear only when the underlying transaction contains applicable data; task and counterparty details are not fabricated.
- Transaction status comes from the backend receipt, not from the payment purpose. Only successful receipts show the verified badge; pending and failed statuses use warning and error colors.

### Email Verification Banner

File: `app/(main)/home.tsx`
Last updated: 2026-09-24

| Property | Standard |
| --- | --- |
| Background | `#f3eeff` brand-subtle surface |
| Border | `1px #e4d6ff` |
| Border radius | `16px` |
| Text, primary | Geist 600, 15px, `#111122` |
| Text, secondary | Geist 400, 13px, `#5a5a70` |
| Spacing | `16px` padding, `12px` content gap and outer top margin |
| Interactive state | Pressed opacity `0.9` |
| Accent usage | `#6c3bff` for the verification action |

**Pattern notes:**

- Account-state banners use the standard card radius and screen gutter.
- Keep the consequence summary to one short line and pair it with a single explicit action.

### Required Location and University Inputs

Files: `app/location-confirm.tsx`, `app/location-university.tsx`, `app/post-details.tsx`
Last updated: 2026-09-27

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` canvas and `#ffffff` selectable surfaces |
| Border | `1px #e0e0ea` on form inputs and selected rows |
| Border radius | `8px` inputs and rows, `12px` primary action |
| Text, primary | Geist 500 or 600 with `#111122` |
| Text, secondary | Geist 400 or 500 with `#5a5a70` |
| Spacing | `16px` screen gutter and footer padding, `8px` compact gaps |
| Interactive state | Pressed opacity `0.9`, unavailable actions visually disabled |
| Accent usage | `#6c3bff` for map, selection, retry, and primary actions |

**Pattern notes:**

- Required onboarding values remain on screen when persistence fails and show a retryable error.
- Campus task posting shows the chosen university as a form row and returns to the same draft after editing it.
- Location-dependent actions require numeric coordinates. A display address alone is never presented as a successfully saved service location.

### Recoverable Wallet Funding

File: `app/wallet.tsx`
Last updated: 2026-09-28

| Property | Standard |
| --- | --- |
| Background | `#fff8e6` for a pending payment recovery card |
| Border | `1px #f3c969` |
| Border radius | `16px` card, `12px` actions |
| Text, primary | Geist 600, 17px, `#111122` |
| Text, secondary | Geist 400, 14px, `#5a5a70` |
| Spacing | `16px` card padding, `10px` content gap |
| Interactive state | Pressed opacity `0.9`, pending opacity `0.5` |
| Accent usage | `#6c3bff` for resume and status actions |

**Pattern notes:**

- Hosted financial flows must remain recoverable after backgrounding or process loss.
- Pending cards pair one primary resume action with one outlined server-status action.
- Payment success is server-authoritative and must invalidate wallet queries before presenting completion.

### Precise Location Selector

File: `app/location-map.tsx`
Last updated: 2026-09-28

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` canvas, `#ffffff` search and result surfaces |
| Border | `1px #e0e0ea`, brand border on the selected result |
| Border radius | `16px` selection card, `12px` inputs and actions |
| Text, primary | Geist 600 or 700 with `#111122` |
| Text, secondary | Geist 400 with `#5a5a70` |
| Spacing | `16px` screen gutter and content gaps |
| Interactive state | Pressed opacity `0.9`, disabled opacity `0.5` |
| Accent usage | `#6c3bff` and `#f3eeff` for location actions and selection |

**Pattern notes:**

- Location selection must return both a display address and finite coordinates.
- Address search and current GPS are equal recovery paths. Neither depends on a native map SDK.
- Search, permission, network, empty, selected, and pending states remain visible and actionable.

### Nearby Task Directory

File: `app/tasks-near-you.tsx`
Last updated: 2026-09-28

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` canvas and `#ffffff` task cards |
| Border | `1px #e0e0ea` |
| Border radius | `16px` cards, `12px` actions, `8px` compact badges |
| Text, primary | Geist 600 or 700 with `#111122` |
| Text, secondary | Geist 400 with `#5a5a70` |
| Spacing | `16px` screen gutter and card padding, `12px` list gap |
| Interactive state | Pressed opacity `0.9`, pull to refresh, paginated loading |
| Accent usage | `#6c3bff` and `#f3eeff` for mode badges and actions |

**Pattern notes:**

- Location-aware directories use the tasker feed as the only source of truth.
- Loading, error, empty, content, refresh, and next-page states are all explicit.
- Task cards display only server-provided price, location, time, application mode, and bid state.

### Identity Verification Status

File: `app/nin-verification.tsx`
Last updated: 2026-10-04

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` canvas, `#ffffff` status card |
| Border | `1px #e2e2ec` card, brand border on secondary action |
| Border radius | `16px` card, `12px` actions |
| Text, primary | Geist 600 or 700 with `#111122` |
| Text, secondary | Geist 400 with `#5a5a70` |
| Spacing | `16px` screen gutter and card padding, `24px` section gap |
| Interactive state | Pressed opacity `0.9`; pending action disabled |
| Accent usage | `#6c3bff` actions, `#b45309` review state, `#12b76a` verified state |

**Pattern notes:**

- `under_review` alone locks identity resubmission. `in_progress` and `not_started` offer a Complete Profile action that resumes the provider session.
- Loading and failed status checks have explicit states; a stale profile badge never creates a review lock.
- Returning from the hosted browser refreshes verification status before the user decides what to do next.

### Conversation Inbox Search

File: `app/(main)/messages.tsx`
Last updated: 2026-10-04

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` canvas, `#ffffff` header, `#f2f2f7` search field |
| Border | None on search field |
| Border radius | `8px` search field |
| Text, primary | Geist 500 with `#111122` |
| Text, secondary | Geist 500 with `#a0a0ba` placeholder |
| Spacing | `16px` header gutter, `10px` search-field gap, `24px` list gap |
| Interactive state | Clear action in `#6c3bff`; query is debounced |
| Accent usage | `#6c3bff` for clear and loading controls |

**Pattern notes:**

- Search is server-side so results include conversations beyond the first page.
- Keep loading, network error, no conversations, and no matching conversations as distinct states.
- Use a virtualized list for paginated inbox results; SDK 54 does not have the Expo UI universal list layer.

### Task Posting Taxonomy Search

Files: `app/post-category.tsx`, `app/post-service.tsx`
Last updated: 2026-10-04

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` canvas, `#f2f2f7` search field |
| Border | None on search field |
| Border radius | `8px` search field and service rows |
| Text, primary | Geist 500 with `#111122` |
| Text, secondary | Geist 500 with `#a0a0ba` placeholder |
| Spacing | `16px` screen gutter, `10px` search-field gap, `24px` below search |
| Interactive state | Clear action in `#6c3bff`; selected services retain their state while filtering |
| Accent usage | `#6c3bff` on clear and selected service states |

**Pattern notes:**

- Category search covers main category and child service names; service search covers the complete fetched category list.
- Zero catalog items and zero search matches have different messages.
- Filtering never clears selected services from the draft.

### Typed Location Entry

File: `app/location-permission.tsx`
Last updated: 2026-10-07

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` canvas, `#ffffff` inputs |
| Text, primary | Geist 700 with `#111122` |
| Text, secondary | `#5a5a70` |
| Spacing | `20px` screen gutter, `10px` form gap |
| Interactive state | Continue validates address, city, and state, then saves all three |
| Accent usage | PrimaryButton purple action |

**Pattern notes:**

- Do not ask for device location permission or use geocoding. The user types an address, city, and state.
- Keep the primary action inside the scrollable form so it remains reachable with the keyboard open.
- The same three fields are used by post-task and edit-profile screens.

### Signup Date-of-Birth Input

Files: `app/create-account.tsx`, `app/google-complete-signup.tsx`, `app/tasker-details.tsx`
Last updated: 2026-10-04

| Property | Standard |
| --- | --- |
| Background | `#ffffff` input on `#f9f9fb` canvas |
| Border | `1px` solid `#e0e0ea` |
| Border radius | `8px` |
| Text, primary | Geist 500, `17px`, `#111122` |
| Text, placeholder | `#a0a0ba` |
| Spacing | `16px` input horizontal padding; `16px` between fields |
| Error | Existing red signup error below the form |

**Pattern notes:**

- Keep DOB formatting (`YYYY-MM-DD`) and 18+ validation identical for user, social, and tasker signup.
- Reuse the existing signup field treatment; SDK 54 does not provide the Expo UI universal form controls.

### Tasker Identity Badge

Files: `app/tasker-profile.tsx`, `app/saved-taskers.tsx`
Last updated: 2026-10-09

| Property | Standard |
| --- | --- |
| Background | `#edfaf3` (`COLORS.successBg`) |
| Border | None |
| Border radius | `999px` pill |
| Text, primary | Geist 500, `#0d6639` (`COLORS.successText`) |
| Spacing | `8px` horizontal, `2px` to `4px` vertical, `4px` icon gap |
| Accent usage | Success green only for confirmed identity |

**Pattern notes:**

- Render “Verified Tasker” or “Verified” only when the backend identity flag is explicitly `true`. Missing or false status must not display a trust badge.
- The public tasker profile response maps the backend's `verifyIdentity` to `isVerified`; saved taskers already receive `isVerified` from the backend.

### Optional Bidding Deadline Control

Files: `app/post-details.tsx`, `app/edit-task.tsx`, `app/task-details.tsx`
Last updated: 2026-10-09

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` screen canvas, `#ffffff` form input |
| Border | `#e0e0ea` input border |
| Border radius | Match adjacent task form inputs; `12px` for the primary reopen action |
| Text, primary | `#111122` selected date and task values |
| Text, secondary | `#5a5a70` explanation and clear action, `#a0a0ba` placeholder |
| Spacing | Use the existing task-form field gap and scrollable form padding |
| Interactive state | Native date picker for selection; explicit Clear deadline; disabled reopen while saving |
| Accent usage | `#6c3bff` for the reopen action |

**Pattern notes:**

- The date is optional and means last day to place a bid, not completion due date.
- Explain the no-bid closure and wallet refund alongside the field. Display “No bidding deadline” when unset.
- Closed tasks use the existing task card; details provide a wallet-funded reopen action and the existing delete action.

### Task Actions Sheet

File: `components/taskhub/task-actions-modal.tsx`
Last updated: 2026-10-09

| Property | Standard |
| --- | --- |
| Background | White sheet over `rgba(17, 17, 34, 0.4)` backdrop |
| Text, primary | `#111122` |
| Text, secondary | `#5a5a70` with `#b01515` destructive actions |
| Spacing | Existing action-row padding and bottom safe-area inset |
| Interactive state | Render only actions with valid handlers for the current task status |
| Accent usage | Destructive red only for cancel/delete/report |

**Pattern notes:** Closed tasks expose Delete but not Edit or Cancel. Reopen is the separate primary action on the task detail.

### Role-Aware Profile Stats and Reviews

Files: `app/(main)/profile.tsx`, `app/tasker-profile.tsx`, `app/my-reviews.tsx`
Last updated: 2026-10-16

| Property | Standard |
| --- | --- |
| Background | `#f9f9fb` canvas; `#ffffff` profile and review cards |
| Border | Existing `#eef0f3` review-card border |
| Border radius | Existing `16px` stat and review cards |
| Text, primary | Geist 600, `#111122` |
| Text, secondary | Geist 400/500, `#5a5a70` |
| Spacing | Existing profile stat row and `12px` review-list gap |
| Accent usage | `#6c3bff` for the active review tab and actions |

**Pattern notes:** Show server-calculated role metrics without mock fallbacks: users see posted, completed, and trust score; taskers see completed, average rating, and earned. Review tabs query the appropriate role endpoint. Keep long currency values inside cards with one-line font fitting.

### Public Tasker Services Disclosure

File: `app/tasker-profile.tsx`
Last updated: 2026-10-17

| Property | Standard |
| --- | --- |
| Collapsed surface | `#f3eeff` brand-subtle, 12px radius, 48px minimum tap height |
| Expanded items | White cards, 10px radius, `#e0e0ea` border, 8px vertical gap |
| Text | Geist 600 brand-purple toggle; Geist 500 dark service names |
| Interaction | Button announces expanded state; all selected subcategories appear in one vertical list |

**Pattern notes:** Read populated `subCategories` from the public tasker detail API, using `services` only as a legacy fallback. Never display raw MongoDB IDs as service names.


### Linked Tasker Creation — 2026-10-21

In `app/tasker-services.tsx`, reuse the services screen palette and spacing for the server-declared missing personal fields. Labels use the existing section style; inputs have 48-point minimum height, 8-point radius, and border color `COLORS.border`, changing to red for field errors. Preserve all drafts on failure. Campus university search uses public university names with 48-point option targets. Role creation uses POST /roles with missing details and services in one request while still authenticated as User; persist and activate the returned Tasker session before fetching the Tasker profile. PUT /categories is only for existing Tasker roles.
