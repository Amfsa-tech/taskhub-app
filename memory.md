# Memory — TaskHub Sign-In Audit and Release Context

Last updated: 2026-10-08

## What was built

- No code was changed during the 2026-10-08 sign-in audit.
- Earlier, the backend and web repositories gained a blog CMS: public `/blog` pages, an admin Markdown editor, media upload/embedding, private draft autosave, direct publishing, and a writer role limited to its own articles. This has not been deployed or tested end-to-end against live services.
- Earlier mobile, web, and backend changes enforce 18+ signup and improve manual location entry and iOS permission wording. Preserve the substantial pre-existing uncommitted changes in all repositories.

## Decisions made

- Android package is `com.taskhub.connect`; iOS bundle ID is `com.amfsatech.taskhub`.
- The signup minimum age is 18+, matching the Terms. Store-facing copy should not use an em dash.
- Writers can save drafts and publish directly, but manage only their own articles. Published content is a separate snapshot from the private draft.

## Problems solved

- Diagnosed the photographed Android Google Sign-In `DEVELOPER_ERROR` as a native OAuth configuration mismatch, most likely an Android package/signing-certificate SHA-1 mismatch. The mobile production Web client ID matches the local backend Google client ID, so that particular mismatch is not evident locally.
- Audited Apple sign-in source: the Expo native capability/button is configured, the client passes an identity token, authorization code, and nonce, and the backend verifies Apple tokens and links identities by provider subject. Local Apple configuration validation passed; local backend and iOS bundle identifiers match. This is not proof of a successful production device sign-in.

## Current state

- On 2026-10-08, mobile TypeScript and `npx expo install --check` passed. Backend Apple configuration check passed; backend tests passed 55/55. These are local checks, not device or live-backend verification.
- The Google Play app-signing SHA-1 and Google Cloud Android OAuth client were not accessible from the repository, so the Google error remains unresolved. If installed from Play, use the **App signing key certificate** SHA-1 in Play Console, not only the upload key. Google Cloud needs an Android OAuth client for `com.taskhub.connect` and that SHA-1; a local/dev build needs its own certificate client.
- Apple server-to-server notifications were previously left unconfigured in Apple Developer. This does not block sign-in, but the backend will not receive Apple account/revocation events through that endpoint until configured. A real iPhone test of first signup, returning sign-in, and connecting Apple to an existing account is still needed, as is confirmation of production backend environment settings.
- App Store Connect Age Assurance metadata change to **None**, earlier Apple review fixes, and a replacement iOS binary remain unconfirmed. The last known reviewed build was 1.0 (10).
- Blog CMS web production build and backend tests passed earlier, but the CMS was not deployed. Its new UI follows `#6B46C1`; the existing web app also uses `#6C3BFF`. No web `ui-registry.md` baseline was written because the `imprint` skill requires user confirmation first.

## Next session starts with

1. For Google Sign-In, inspect Play Console → App integrity → App signing key certificate SHA-1 and compare with the Android OAuth client in Google Cloud for `com.taskhub.connect`. Also identify whether the failed install came from Play, internal sharing, or a local APK, since each may use a different signer.
2. Test Apple sign-in on a real iPhone against the deployed backend: new account, returning account, provider linking, and both User and Tasker roles. Confirm production Apple environment variables are present without exposing their values.
3. If desired, configure Apple server-to-server notifications at the backend endpoint and validate delivery. Separately confirm App Store Age Assurance metadata and release status.
4. For the blog CMS, test writer invite/login, upload, autosave, publish, and public rendering against a configured test environment before deployment. Ask whether `#6B46C1` is the admin/blog UI baseline before completing the web UI registry.

## Open questions

- Which distribution produced the Google error: Play Store, internal app sharing, EAS preview APK, or local debug build?
- Does the Google Cloud project have Android OAuth clients for the correct signing SHA-1 values?
- Has Apple sign-in been tested successfully on a real iPhone and has the production backend been configured identically to local?
- Has App Store Age Assurance been set to None, and have the earlier mobile, backend, and web changes been deployed?
