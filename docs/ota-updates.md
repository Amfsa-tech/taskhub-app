# Mobile OTA updates

TaskHub uses EAS Update for compatible JavaScript, styling, and bundled asset updates on Android and iOS.

## First OTA-enabled release

This setup adds a native dependency and update configuration. Existing binaries, including iOS build 28, cannot gain OTA support retroactively. Build and distribute a new binary for each platform before expecting these updates to reach users.

The existing `production` profile still uses remote version management and automatic build-number increments:

```sh
eas build --profile production --platform all
```

Submit and release the resulting binaries through the usual store process. A preview binary can be built with `eas build --profile preview --platform android` or the equivalent iOS command to test automatic update delivery before the store release. The existing Android preview profile produces an APK.

## Channels and configuration

| Build profile | Update channel | EAS environment |
| --- | --- | --- |
| development | development | development |
| preview | preview | preview |
| production | production | production |

Each channel points to the EAS branch with the same name. These branches are separate from Git branches. Pushing Git commits does not publish an OTA update.

EAS environments supply the public API URL, Google sign-in client IDs, and OneSignal app ID to both native builds and OTA exports. Keep their values appropriate for the target environment. `EXPO_PUBLIC_*` values are included in the app and must never contain secrets.

The initial production values are preserved, and development and preview start with the same service configuration as the previous build profiles. Their update channels remain separate.

## Publish a compatible update

Commit and test the intended changes first. Use a descriptive message and select the deployment target explicitly:

```sh
npm run update:preview -- --message "Fix task list refresh"
```

Test on an OTA-enabled preview binary. A release binary checks and downloads updates in the background without delaying startup. Fully terminate and reopen it, allow the download to finish, then terminate and reopen it again if needed. The second cold launch runs the downloaded update. An ordinary development client uses its Extensions UI instead of the release startup flow.

After validating the changes, publish the reviewed commit to production using its production environment:

```sh
npm run update:production -- --message "Fix task list refresh"
```

There is also `npm run update:development -- --message "Describe the change"` for development clients. These commands use the pinned EAS CLI version and export both platforms; they do not submit a native binary to either store. They require access to the linked Expo project.

## Native compatibility

The runtime version uses Expo's `fingerprint` policy. Each platform only receives updates that match its native fingerprint. Adding or changing native libraries, permissions, plugins, Expo/React Native SDKs, or other native configuration can change that fingerprint and requires a new binary. Do not replace the policy with a fixed runtime string to bypass a mismatch.

OTA cannot change the Xcode/iOS SDK used to build an installed app, upgrade native modules, or satisfy Apple's future native SDK submission requirements. Different active native runtimes may need separate compatible OTA releases.

The app retains its embedded bundle and Expo's normal recovery protections. Do not disable anti-bricking safeguards or force a reload while a user is working on a task. The Settings store-update check continues to handle new native app versions.

## Wallet confirmations and checkout

The wallet's Continue to Payment action requests a fresh native biometric confirmation when the current account has an active biometric enrollment on this device. Disabled enrollment and enrollment for another profile do not trigger a prompt. Cancellation, lockout, unavailable biometrics and failed enrollment-status requests never start checkout. The amount stays available for retry, and duplicate taps cannot initialize another payment while confirmation is pending.

This uses the biometric module already present in iOS build 29 and Android version code 13, so it can ship through OTA without changing the native runtime. It is a local confirmation before initiating funding, not a server-enforced transaction authentication protocol. The existing signed biometric login and payment-provider authorization remain separate.

Funding checkout waits for the native sheet's `onDismiss` completion on iOS before opening Safari. Opening Safari in the same turn as setting the funding sheet invisible can present it from the dismissing sheet, closing the browser immediately and leaving an unresponsive native presentation. Android uses a separate browser activity and waits for the hidden-sheet React commit. Browser-opening failures retain the checkout reference and unlock Return to payment; repeated taps cannot present overlapping browsers.

Tasker withdrawal submission uses the same current-account/current-device biometric enrollment rules, with a fresh Confirm withdrawal prompt. Cancellation preserves the draft. The selected amount, destination and PIN stay fixed through confirmation, and the existing server transaction PIN requirement still applies. Leaving the screen or switching accounts discards late confirmation results before submitting a withdrawal.

Calendar buttons reveal the date picker immediately: native inline calendar on iOS and calendar dialog on Android. Task posting, editing, reopening and history date filters use this configuration rather than iOS's compact date-label control. Dates continue to use the existing plain-date API format. These are JavaScript changes to the date-picker module already included in the store builds.

For incident recovery, follow the [EAS Update rollback guide](https://docs.expo.dev/eas-update/rollbacks/). No production OTA update or store build is published merely by installing this configuration.
