# UI Pattern Registry

### Verification provider availability

The verification screen uses the server provider list to show available actions,
with QoreID first. Loading and temporary-unavailability messages use the existing
secondary text style. A failed lookup shows an inline error and a retry button.
Keep status refresh available when every capture provider is disabled.

### Security confirmation and referral cards

Use the existing white surface, 16-point card corners, and gray border. Keep
instructions in 13–14-point secondary text and verification controls in the
brand purple. Use a labeled numeric input with one-time-code autofill and
show server errors beside the input. Referral codes and links are selectable
and the share action opens the native share sheet.

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
- Wallet funding confirmation reuses the native biometric prompt and the existing purple button's white spinner. While pending, lock amount entry, presets and dismissal. Cancellation preserves the draft; verification errors use the existing alert and never open checkout.
- Native checkout presentation follows funding sheet dismissal completion on iOS; Android launches after the hidden sheet commits. Keep the saved-checkout recovery card usable after browser failures. Withdrawal confirmation reuses the native prompt, existing footer spinner and inline error treatment, with amount, destination and PIN controls disabled while submitting.

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


### Support Phone Links — 2026-10-26

`app/help-support.tsx` displays the two support lines from `lib/support-contact.ts` independently of contact API loading. Reuse the white `faqCard` surface, 16px radius, divider, and 16px vertical row padding; Geist 600 phone labels use `#111122` and call icons use `#6c3bff`. Each full row is an accessible link with pressed opacity. Label +234 703 133 2517 **Chat with Us** and open its `wa.me` chat; label +234 913 530 8859 **Call Us** and open its `tel:` destination. On failure, show the readable number in an alert.

### Linked Tasker Creation — 2026-10-21

In `app/tasker-services.tsx`, reuse the services screen palette and spacing for the server-declared missing personal fields. Labels use the existing section style; inputs have 48-point minimum height, 8-point radius, and border color `COLORS.border`, changing to red for field errors. Preserve all drafts on failure. Campus university search uses public university names with 48-point option targets. Role creation uses POST /roles with missing details and services in one request while still authenticated as User; persist and activate the returned Tasker session before fetching the Tasker profile. PUT /categories is only for existing Tasker roles.

### Role Switching and Linking — 2026-10-26

Profile switch cards describe the destination role: user mode uses “Post tasks and get things done”, while tasker mode uses “Earn money by completing tasks”.

Both missing-role prompts offer Start onboarding and Link existing. The link screen keeps its original target role throughout session activation; disable credential editing once linked and offer Retry loading profile after a hydration error. Linked User creation reuses the existing white form, 48-point inputs, and purple primary button, prefilling name and supported country from the current profile. Keep the initial creation intent across role changes so retries refresh the profile instead of registering a separate account. Tasker service creation retries also hydrate the new profile without sending another creation/category update.

### Support Channels and Home Shortcuts — 2026-11-02

Files: `components/taskhub/support-contact.tsx`, `components/taskhub/support-widget.tsx`, `app/(main)/home.tsx`

| Property | Standard |
| --- | --- |
| Support modal | White surface, 24-point radius, 20-point padding, dark 40% backdrop |
| Channel rows | 12-point radius, `#e0e0ea` border, 16-point padding, 12-point gap |
| Text | Geist 600 channel titles in `#111122`; Geist 400 descriptions in `#5a5a70` |
| Support accent | `#15803d` WhatsApp icons and trigger text |
| Touch targets | At least 48 points for triggers and 64 points for channel rows |
| Wallet shortcut | Geist 600, 13 points, brand purple, 44-point minimum tap height |

**Pattern notes:** Help, payment failures, and the floating Need help action share one chooser with both configured phone numbers. Label +234 703 133 2517 **Chat with Us** and open WhatsApp with the payment reference in a draft message. Label +234 913 530 8859 **Call Us** and open only the dialer. Keep the chooser open with a readable fallback if linking fails. Place floating help above the tab bar and away from chat, auth, and capture screens. Category shortcuts reset the old draft, select the actual API category, and go directly to services; generic Post retains category selection.

### Personalized Support Drafts — 2026-11-02

Channel 1 is **Chat with Us**, +234 703 133 2517, and opens WhatsApp with a draft containing the current account's full name (or first and last names), email, a readable description of the failed action, and a labeled payment reference when available. Channel 2 is **Call Us**, +234 913 530 8859, and opens only the dialer. Use the shared support-context builder; never concatenate raw backend errors, error codes, or credentials into a draft. Floating help uses the current screen/account's recent failure; matching successful retries, navigation, and account changes clear stale context. Public visitors without profile details get no invented name or email. Keep the existing modal surfaces, spacing, and action colors.

### Wallet Balance Loading — 2026-11-02

Use two rounded skeleton bars for the main balance and secondary balance while their query is pending. Keep the existing card surface; use gray-200 on white web cards and translucent white on purple cards. Label the group “Loading wallet balances” for accessibility. Show actual failure states after loading ends. Support channel titles use a space between the channel number and action, without a dash.

### Verification Decisions and Campaign Universities — 2026-11-04

Display terminal duplicate-identity messages in error red (`#dc2626`) with an accessible alert and the shared support chooser. Hide verification launch actions until the backend explicitly permits resubmission; refresh status remains available. Verification polling stops on duplicate/fraud decisions. Brand Campaign is a Settings row using the existing native row and purple accent, opening the full web campaign form in the in-app browser.


### Verification result feedback - 2026-11-07

Capture submission is a neutral checking state, using the existing gray body text and loading spinner. Show backend rejection messages in the existing red alert style with Contact Support; a duplicate identity never offers another capture attempt. Other rejected attempts offer retry only with explicit backend permission. Approval uses the existing success treatment only after a status response confirms it. Under review is a stable state. Result polling lasts at most 90 seconds at four-second intervals and never continues in the background after the verification screen unmounts. Timeout/network failure uses neutral processing text and a manual Refresh status action; it is not an approval or rejection.

### Referral sharing and counts - 2026-11-19

Files: `app/referrals.tsx`, `components/taskhub/referral-card.tsx`, `components/taskhub/referral-actions.tsx`

Use the existing `#f9f9fb` canvas, white cards, 1px `#e0e0ea` borders, 16px card radii, 20px card padding and 12px internal gaps. Headings use 17px semibold `#111122`; body copy uses 14px `#5a5a70` with 21px line height. Highlight selectable referral codes in brand purple `#6c3bff`. Copy and Share have 12px radii, 14px vertical padding and semibold labels, using purple outlines or purple fills. Dim unavailable actions to 50% opacity. Counts use matching cards with 23px bold values and neutral skeletons; show readable error and retry states instead of invented zero counts. Share uses only the server's prepared message through the native share sheet. Keep the profile entry available while referral details load.

### Tasker profile completion - 2026-11-20

File: `components/taskhub/tasker-profile-progress-card.tsx`

Home and Profile share the same completion card: `#f3eeff` surface, 1px `#e4d6ff` border, 16px radius/padding and 12px gaps. Keep Geist semibold 15px headings in `#111122`, 13px purple subtitles, and a 12px purple percentage. Draw the ring from the same 0–100 score as its label and expose an accessible progress value. Use the backend's photo/services/portfolio/identity checklist, link to the next missing section, and hide the card at 100%. KYC approval alone does not complete the profile.

### Biometric setup and sign-in - 2026-11-20

Files: `components/taskhub/biometric-dialog.tsx`, `components/taskhub/biometric-setting.tsx`, `components/taskhub/biometric-login-button.tsx`

Biometric setup uses a centered white modal with a 28px radius, 24px padding, subtle purple border and dimmed backdrop. Frame the native fingerprint/Face ID symbol in concentric pale purple circles with a small shield badge. Use Geist semibold 23px centered headings, 14px gray body copy, purple 14px-radius primary buttons and separate cancel/password actions. Email confirmation appears as five outlined digit cells inside the modal, with a purple active cell and standard one-time-code autofill. Keep validation errors inside the modal, and clear the draft on dismissal or profile changes. The sign-in entry is a bordered white card with a purple icon tile and supporting caption. Actual biometric authentication always uses the OS prompt; the custom modal presents setup and recovery feedback.

### Verification resume and historical balances - 2026-11-20

Files: `app/nin-verification.tsx`, `app/receipt.tsx`, `app/transaction-history.tsx`

Show Pending for both pending and in-progress KYC. Keep the existing provider controls available to continue an unfinished session, with under review, approval and backend-blocked rejections remaining protected. Provider availability refreshes on screen entry and before launch, with no retained cache or recurring poll. Receipt balance rows use existing gray labels and semibold dark values; history uses the existing secondary metadata text style. Unknown before/after balances display an em dash, legitimate zero displays as currency, and authoritative Kobo snapshots take precedence. Preserve wrapping on narrow screens and keep financial mutations disabled only while the request is pending.

### Security checks and personal data - 2026-11-20

Files: `components/taskhub/captcha-provider.tsx`, `components/taskhub/turnstile-challenge.tsx`, `components/taskhub/download-my-data.tsx`

Security checks open a centered white modal with 24-point corners, 20-point padding, a dimmed backdrop, 21-point semibold heading and gray 14-point description. Keep Cancel separate, with an outlined 12-point-radius control and purple text. The embedded browser shows only the hosted challenge; load it on demand, validate the source URL, and unmount it after completion or cancellation. Settings data export uses the existing Privacy card, purple download icon and a disabled preparing state. Save/share the authenticated JSON through the system sheet; remove the temporary file afterwards and cancel requests on account changes or unmount. Display Error ID references in readable text. Hide unavailable earnings statistics and keep a legitimate zero visible.


### Biometric code entry and contextual help - 2026-11-21

Files: `components/taskhub/biometric-setting.tsx`, `components/taskhub/biometric-dialog.tsx`, `hooks/use-support-message.ts`, `lib/support-context.ts`

Keep the existing white biometric modal and five 54-point digit cells with 12-point corners, 8-point gaps, 23-point Geist semibold digits, neutral borders and purple active outline. The native OTP input stays fully transparent (view opacity zero) so Android composing text cannot paint over the digit cells; tapping the row refocuses it. Preserve numeric entry, leading zeros and one-time-code autofill. Blur on confirmation or dismissal, and avoid the keyboard on both platforms with scrollable content. Help retains its white channel cards and green WhatsApp accent. Drafts use the current page or readable failure, including the page that opened Help, plus the current name and email. Clear inherited failures on successful retries, leaving Help or account changes; Home uses general help unless an explicit issue is supplied.


### Rate-limited chat and invitations - 2026-11-23

Files: `app/chat.tsx`, `components/taskhub/invite-to-bid-modal.tsx`

Keep the existing chat composer and invitation sheet styling. Display the server's rate-limit explanation through the existing native error alert; retain unsent chat text and the invitation note. Disable duplicate sends while pending and enable manual retry after rejection. Clear a chat draft only after a successful send, preserving a different draft typed in flight. The invitation sheet uses its existing purple send button with a Sending state; the parent closes it and confirms success only after the backend accepts the request. Do not show a premature sent screen or add retry timers.

### Task address and escrow confirmation — 2026-11-24

Task create/edit forms use one labeled free-form Task address input, retaining the existing white surface, gray border, input radius, purple focus state and helper typography. City and state are optional address content. Preserve entered punctuation, accents and landmarks; require only non-blank text for local tasks.

Hire requests appear in their own labeled section and do not contribute to Bids counts. Pending invitations expose a waiting state; accepted invitations expose confirmation, and completed/rejected/cancelled offers never expose an active Accept Bid button. A tasker who accepted a hire sees Awaiting client confirmation before assignment.

Payment summaries reuse white rounded cards, muted labels, purple actions and the green escrow notice. Show task total, fee included in that total, already-held task escrow, additional wallet charge and any refund separately. When the wallet charge is zero, label the primary action Confirm hire using escrow and state No additional wallet payment. Use the server's live figures and readiness flags, show recoverable errors/retry, and disable confirmation while refreshing or submitting.

### Notification metadata regression — 2026-11-24

The mobile inbox shows the notification title, message, readable timestamp and unread state. Keep internal type/action values and task/bid/conversation IDs out of rendered content. Metadata drives navigation only: a chat action opens its conversation when available and otherwise opens the related task.

### Marketplace account selection and closed tasks — 2026-11-24

Sign-in shows a two-option radio group: User · Hire a tasker and Tasker · Find work. Reuse Geist labels, 8px corners, white surface and #e0e0ea border; selection uses #f3eeff with #6c3bff border/text. Disable selection during sign-in; preserve credentials and explain corrected role inline. Get Started exits the intro on every slide.

Unavailable task screens keep the existing Back action, heading and muted explanation. Owner reopening uses the existing purple action only during the 30-day grace period. Notification content shrinks within the row while timestamps retain their width; long titles and messages wrap.

### Task discovery, sharing and lifecycle corrections, 2026-11-25

Quick category controls represent active categories with actual child services and navigate directly to that category's service step. Hide unavailable shortcuts. Urgent badges reuse the red/pink pill and lightning icon on both sides, with a 72-hour bidding window and a local timer for visible cards. Do not show closed tasks as urgent.

Show each tasker invitation once and replace Accept with awaiting-customer confirmation immediately after consent. Completed acceptance/payment milestones stay checked in later lifecycle states. Submitted work stays in In Progress and exposes Review Work for the customer. Nudge uses a pending/disabled action, real chat delivery, and success only after delivery is accepted.

Profile shares use descriptive hiring copy plus the direct profile link, without raw identifiers or attached photos. Link metadata uses the public profile photo and a purple TaskHub-logo fallback. Preserve the profile destination through registration, verification and sign-in. Use real profile photos or neutral branded/initial fallbacks. Interface copy uses normal punctuation and short N/A placeholders instead of em dashes.

### Verified content and masked email - 2026-11-26

Task cards show the saved category/service, address (including optional city/state), and a complete posted date with year. Missing data uses a readable unavailable label; missing coordinates never imply Remote. Category IDs and application modes are not category labels. Account presence and verification badges require actual API flags. Public landing panels explain product workflows without invented customer records, ratings, testimonials or campaign counts. Receipts require a loaded authenticated transaction.

OTP email hints are masked by default, including short local parts. Use one page-level visibility state for every repeated hint, a small purple eye button, a 32px minimum control with extra hit area on mobile, and Show/Hide email address accessibility labels. Reset visibility when the address or verification challenge changes; keep the full address only in request data.

The bottom Settings row opens a centered 24px-radius update modal with a purple gradient, white headings/body text, a spinner while checking and the TaskHub logo on resolved states. Use 23px semibold headings, 14px/22px body text, 48px purple primary actions, and a separate Close/Cancel action. Store checks distinguish available, current and unavailable; preserve retry and failed store-opening feedback. Dismissed requests cannot reopen the modal.

### Current work and history filters - 2026-11-26

Keep only two equal-width tabs in the neutral rounded segmented control: Posted/In progress for customers and Pending/In progress for taskers. Link to Task history or Job history directly underneath with a purple clock and arrow. Historical records retain their existing cards and actions. Work awaiting customer confirmation remains in progress.

History controls use compact 36px rounded chips with calendar/category/status icons, a chevron and an applied-selection count. Selected chips use pale purple, purple borders and purple text. Pending jobs expose one Type control for invitations and bids sent. Choices are drafts until Apply filters; dismissing discards them, Reset selection clears only that draft section and Clear filters resets all applied fields. Date ranges use inclusive task-posting days in Nigeria.

Mobile filters use a dimmed backdrop, white sheet with 24px top corners, a short gray handle, 19px semibold title, light neutral checkbox rows and a full-width purple Apply button. Desktop uses an anchored white 340px panel with a subtle border and shadow; narrow web uses the bottom sheet. Preserve keyboard dismissal, focus return, accessible checkbox states and inline reversed-date errors.

Calendar actions reveal the full date selector on the first tap: inline calendar on iOS and calendar dialog on Android. Use the light native theme against white form/sheet surfaces. Apply this consistently to task posting, editing, reopening and date-range filters; do not insert the iOS compact date-label step.


### Bidding choice window - 2026-11-26

Task cards and task details show purple 13px notices for bidding-ended and owner choose-by information, with 19px line height. The Posted tab retains server-open tasks during the 48-hour offer selection window. Tasker Pending retains waiting offers but disables new applications and invitation acceptance after bidding closes. Use a neutral Expired history state for selection-window expiry, distinct from Not selected. Display choice deadlines in Nigeria time. Reuse the existing alert with Close and Reopen task actions for selection expiry, and direct reminders to the Bids tab.
