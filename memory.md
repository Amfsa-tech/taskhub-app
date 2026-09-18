# Memory — Taskhub Connect Store Release Handoff

Last updated: 2026-09-18 07:49 +01:00

## What was built

- Completed the Expo SDK 54 mobile app's non-admin parity work, including the user and tasker task lifecycle, messaging and attachments, sessions, notification preferences, account deactivation, permanent account deletion, role switching, wallet and transaction screens, support flows, performance data, and reviews.
- Implemented permanent account deletion across the mobile and web apps so linked user and tasker role records are removed together and no alternate role is left behind.
- Added and saved the Google Play store listing for Taskhub Connect, including the ASO copy, app category, support details, privacy policy, feature graphic, app icon, and six Android screenshots.
- Completed the Google Play app-content declarations: reviewer access, ads, Advertising ID, government-app status, financial features, health apps, content rating, target audience, and Data safety.
- Configured the Data safety declaration with the account-deletion URL `https://www.ngtaskhub.com/delete-account`, encrypted transport, collected data categories that match the app, and no third-party data sharing declaration.

## Decisions made

- The store-facing app name is Taskhub Connect.
- The iOS bundle identifier is `com.amfsatech.taskhub`.
- The Android package identifier is `com.taskhub.connect`.
- The OneSignal iOS extension remains under `com.amfsatech.taskhub.OneSignalNotificationServiceExtension` with the matching app group.
- Google Play targets users aged 18 and older and uses the Business category.
- Store-facing copy must never use an em dash.
- The first Android production artifact should be built with EAS Build, not directly from the ignored local Android native directory.
- Google Ads was not activated or started.

## Problems solved

- Confirmed the resolved Expo configuration reports iOS as `com.amfsatech.taskhub` and Android as `com.taskhub.connect`.
- Found an ignored, generated local `android/` directory whose Gradle file still contains the obsolete `com.anonymous.taskhubapp` application ID. Because `/android` is gitignored, the EAS cloud build should regenerate the native project from `app.json` and use `com.taskhub.connect`. Do not run the release build directly with Gradle from the current local Android directory.
- Google Play App content now reports that all required declarations are complete.
- Publishing overview contains the store listing and app-content changes, but the Send app for review button remains disabled until a release bundle is added.

## Current state

- Expo SDK is 54 and the EAS project is already linked.
- `app.json` contains the confirmed iOS and Android identifiers.
- `eas.json` has a production build profile with automatic version-code incrementing enabled. The default Android production output is an AAB.
- The Google Play listing and declarations are saved and ready for a release upload.
- No Android App Bundle has been built or uploaded in this session.
- No release has been submitted for review or published.
- Reviewer credentials were entered manually by the developer and are intentionally not recorded here.
- The working tree contains uncommitted mobile feature and store-preparation changes that must be preserved.

## Next session starts with

1. From the project root, verify Expo authentication with `npx eas-cli@latest whoami` and use `npx eas-cli@latest login` if required.
2. Reconfirm the resolved package with `npx expo config --type public`.
3. Build the Android production bundle with `npx eas-cli@latest build --platform android --profile production`.
4. Allow EAS to manage the Android keystore unless an existing production upload key must be reused.
5. Download the resulting `.aab` from the EAS build page.
6. Upload it manually in Google Play Console under Test and release, starting with Internal testing or the required Closed testing track.
7. Complete release notes and tester setup, test the app, then promote the release to Production and send it for review when Google enables that action.

## Open questions

- Determine whether this Play developer account is subject to the personal-account requirement for at least 12 continuously opted-in closed-test users over 14 days before production access.
- Complete live testing with separate user and tasker accounts, including role switching, payments, messaging, location, notifications, task completion, payouts, and permanent deletion before production submission.
- Decide whether to regenerate the ignored local Android native directory before any future local Gradle build so it cannot accidentally produce the obsolete anonymous package.
- Google Ads setup remains intentionally unstarted.
