# UI Pattern Registry

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

## Destructive Identity Flows: Established 2026-09-17

- Permanent account deletion uses the existing danger surface and requires typed `DELETE` confirmation plus a native destructive confirmation alert.
- Deletion explains linked-role scope, retained de-identified financial records, and server-enforced blockers before the action.
- Backend blocker details remain visible in an amber 16px card so users can resolve each item without losing their entered confirmation state.
- Reauthentication accepts a password or launches fresh Google sign-in for Google-only accounts. The submit action stays pending until the complete linked identity deletion finishes.

