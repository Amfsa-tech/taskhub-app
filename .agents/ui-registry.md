# UI Registry

This registry tracks the visual pattern tokens for TaskHub App UI components to ensure layout, border radius, text weights, and interactive states remain consistent across all screens.

---

### Tasker Job Card

File: [tasks.tsx](file:///c:/Users/JESSE/Documents/Github%20Repo/taskhub-app/app/(main)/tasks.tsx)
Last updated: 2026-07-17

| Property         | Style / Class   |
| ---------------- | --------------- |
| Background       | `#ffffff` (COLORS.surface) |
| Border           | `1px` solid `#e0e0ea` |
| Border radius    | `16` |
| Text — primary   | `Geist_600SemiBold` 17px (`COLORS.textPrimary` `#111122`) |
| Text — secondary | `Geist_500Medium` 13px (`COLORS.textSecondary` `#5a5a70`) |
| Spacing          | padding: `16`, gap: `12` |
| Interactive      | Pressable opacity feedback |
| Shadow           | none |
| Accent usage     | pricing text `#6c3bff` (COLORS.brand), green pricing for completed `+₦1,000` (`#0d6639`) |

**Pattern notes:**
Used across all status types for open, active, escrow pending, completed, and cancelled jobs in the Tasker tab.

---

### Filter Pill / Chip

File: [discover.tsx](file:///c:/Users/JESSE/Documents/Github%20Repo/taskhub-app/app/(main)/discover.tsx)
Last updated: 2026-07-17

| Property         | Style / Class   |
| ---------------- | --------------- |
| Background       | Inactive: `#eff0f3`, Active: `#6c3bff` (COLORS.brand) |
| Border           | none |
| Border radius    | `99` (capsule pill) |
| Text — primary   | Inactive: `COLORS.textSecondary` (`#5a5a70`), Active: `#ffffff` |
| Text — secondary | `Geist_500Medium` 15px |
| Spacing          | paddingHorizontal: `16`, paddingVertical: `8`, scroll view gap: `8` |
| Shadow           | none |

---

### Search Input Wrap

File: [discover.tsx](file:///c:/Users/JESSE/Documents/Github%20Repo/taskhub-app/app/(main)/discover.tsx)
Last updated: 2026-07-17

| Property         | Style / Class   |
| ---------------- | --------------- |
| Background       | `#eff0f3` |
| Border           | none |
| Border radius    | `12` |
| Text — primary   | `COLORS.textPrimary` (`#111122`) |
| Spacing          | paddingHorizontal: `12`, height: `44`, gap: `8` |
| Shadow           | none |
