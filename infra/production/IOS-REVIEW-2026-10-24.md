# iOS build and security review — 24 October 2026

## Status

**Prototype scope update:** The user has chosen a client design-review prototype and will archive/upload iOS themselves. The broader release-readiness items below remain documented for later work. Live payment testing was explicitly deferred; an Android Release APK against production is being prepared for direct client testing. See `PROTOTYPE-TESTING.md` for the current handoff.

A signed **Release** build of `in.valleyride.app` (version 1.0.0, build 1) was built, installed and launched on the connected iPhone 15 running iOS 26.6. Xcode 27.1 signed it with the existing **WT IT SOLUTIONS PRIVATE LIMITED** team (`9Q56J23Z23`). It includes its JavaScript bundle and does not need Metro.

The first device walkthrough exposed a login keyboard blocker. A second Release build containing the fix has been installed and launched. The user confirmed that the keyboard is fixed and login succeeds on the physical iPhone, then confirmed that Explore, Activa details, the date-picker screen, Trips and Profile load correctly. The later report showed that completing date selection still needed the fix recorded below.

No archive or App Store upload was made. No production payment, refund, booking or KYC upload was performed during this review.

## Findings and changes

| Priority | Finding and evidence | Result |
| --- | --- | --- |
| P0 | On the iPhone, the phone keypad covered the password field; the sheet could not scroll and keyboard avoidance flickered. | Removed the sheet-level keyboard avoidance, added native keyboard insets to a scrollable form, and added iOS Next/Done controls. TypeScript and the second device build pass. The user confirmed stable keyboard behavior and successful login. |
| P1 | The old generated iOS project had no native Razorpay pods despite the app importing the native checkout module. | Regenerated iOS and installed `react-native-razorpay`, `razorpay-pod` and `razorpay-core-pod`. The signed app includes Razorpay, RazorpayStandard and RazorpayCore frameworks. |
| P1 | Expo Router's URL decoder had a malformed-input denial-of-service advisory. | Upgraded the decoder to 0.5.1 and added a small CommonJS/ESM compatibility patch for query-string 7.1.3. Normal Unicode links and a 120,000-character malformed encoded value pass regression tests. |
| P1 — open | Account creation exists, but there is no account-deletion screen or API. | Implement an authenticated deletion flow before App Store submission, including treatment of ongoing rentals, refunds, identity documents and any records that must be retained. This review did not delete any accounts or invent a retention policy. [Apple's requirement](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion). |
| P1 — partly complete | Push registration silently skipped because `extra.eas.projectId` was empty. | Linked the project to `@wtsolutions5/valley-ride` and verified the project ID in the built app. APNs credentials and delivery/notification-tap behavior still need an end-to-end device check. |
| P2 | Local test URLs pointed at localhost and the support numbers were empty. | Local configuration now uses the live HTTPS API/site and the existing public support number. Both EAS profiles include the support contact. Release API and web URLs were already pinned to the production domains. |
| P2 | A rejected session could clear stored tokens while leaving a previous user object in memory. | Clear the displayed session user when the API rejects authentication or there is no stored access token. Network failures still preserve tokens. |
| P2 | iOS permission declarations included microphone and Face ID even though these features are not used. | Removed these declarations through the Expo plugin configuration. Camera and photo-library explanations remain. |
| P2 | New Keychain writes could migrate to another device. | Use `WHEN_UNLOCKED_THIS_DEVICE_ONLY` for native secure storage. Passwords remain transient form state; native access/refresh tokens use SecureStore. |
| P2 | Privacy copy claimed Mumbai storage and implied full Aadhaar data could never be stored, although uploaded images can contain a full number. | Corrected the mobile and website source copy to distinguish masked typed numbers from document photos and removed the unsupported region/compliance claim. The website copy change is local and has not been deployed. A final privacy/retention policy and App Store privacy disclosures remain owner work. |
| P2 | Expo packages and automatically selected animation dependencies had drifted from SDK-supported versions. | Updated Expo/Router/notifications/TypeScript and explicitly pinned supported gesture-handler, Reanimated and Worklets versions. Current Expo Doctor result is 20/21, with the upstream Metro Runtime mismatch below. |
| P2 — open | Router 57.0.29 requests Metro Runtime ^57.0.17, while the package registry's available SDK-57 version is 57.0.16. | Kept the available version and recorded the warning rather than changing dependency metadata to conceal it. Both native builds succeed; monitor the upstream release and repeat Doctor after it becomes available. |
| P2 — open | Production dependency audit still reports two high advisories under `expo > @expo/cli`: node-forge and Zod 3. | These are development/build-tool dependencies, not the app's runtime API schemas. Do not force Zod 4 into Expo CLI without compatibility support. Track [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv) and [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). The complete audit reports are saved with the local evidence. |
| P2 — open | Registration accepts a phone number and password while leaving `phoneVerifiedAt` empty. | A registered number is not proof of phone ownership. Add an ownership-verification step if the business relies on that number for identity, account recovery or delivery of sensitive information. |
| P2 — open | The login consent footer names terms/privacy but is plain text; the terms screen is reached elsewhere. | Provide a reachable terms/privacy link before account creation, alongside the final policy text and deletion flow. |

## Connections and access-control checks

The live API passed readiness and returned four locations, four vehicle models and four route guides over verified HTTPS. Payment configuration reports **live** mode and INR. This confirms configuration availability, not settlement or payment-provider correctness.

Unauthenticated admin fleet and customer-document requests returned 401. A private-file URL with an invalid signature returned 403. Source inspection confirms private file signatures expire, upload keys are scoped to the account, passwords are hashed server-side, and payment confirmation is verified by the backend. These are scoped checks, not a complete penetration test.

The actual release artifact has:

- `https://api.valleyride.in` and `https://valleyride.in` as the app service endpoints; no `http://localhost:4000` API address.
- Expo Router origin `https://valleyride.in`. A localhost website string exists in Expo Router's unused fallback implementation; disassembly verifies the app's exported `WEB_URL` uses the HTTPS production constant.
- Expo project `605395ba-9ea7-489d-8690-79cba6821f17` under `wtsolutions5`.
- ATS arbitrary loads disabled; camera/photo descriptions present; microphone and Face ID descriptions absent.
- The UPI query schemes and native Razorpay frameworks required for the native checkout.

Tracked source was scanned for common private-key, AWS access-key and GitHub-token patterns; no matches were found. This pattern scan does not establish that every possible secret is absent.

## Verification

| Check | Result |
| --- | --- |
| Mobile TypeScript | Passed with TypeScript 6.0.3 |
| URL/deep-link security regressions | 2 passed |
| API unit regression suite | 31 passed |
| CocoaPods | Installed successfully, including native Razorpay |
| Signed iPhone Release builds | Both builds passed |
| Code signature | Valid on disk; satisfies designated requirement |
| USB device installation and launch | Passed for both builds |
| Keyboard and login on physical iPhone | User confirmed fixed and signed in |
| Explore, Activa details, dates, Trips and Profile | User confirmed all screens load correctly |
| Production API and access-control probes | Passed; no transactional writes |
| Dependency audit after patch | 0 critical, 2 high build-tool advisories, 0 moderate |
| Expo Doctor | 20/21; Metro Runtime mismatch documented above |

The UX static scan examined 78 files. Its 19 P1 and 33 P2 signals include heuristic false positives (for example, native controls with labels on following lines and an SVG icon classified as Android Compose). They are not 52 verified defects. The confirmed device-level blocker was the login keyboard flow. Existing navigation, brand assets and visual tokens were retained.

The rider flow is: login/register → profile details → Explore → pickup/return and dates → bike → checkout → native payment → trip → documents/pickup signature → return/deposit. The app also includes route guides, payment history, notifications, help and profile/password settings. Admins use the website console; the rental-creation API currently requires a customer-role account.

## Device checks still to finish

Login, discovery, date selection, bike details, Trips and Profile were confirmed on the device. Support-link handoff remains unverified. A customer account is required for the booking flow. For payments, the current backend is in live mode: validate payment success/failure, UPI return, interrupted callbacks and refunds in an approved test environment before submission.

Camera/photo permission denial and recovery, signature capture, APNs delivery, cold-start notification taps, background/resume, network-loss recovery, VoiceOver and large Dynamic Type are not yet fully verified on the physical device. No complete native UI automation suite ran in this review.

## Xcode handoff

Open `apps/mobile/ios/ValleyRide.xcworkspace`, select the **ValleyRide** scheme and the existing WT IT Solutions team. For a manual archive, select an iOS device destination and choose **Product → Archive**. The generated native project is ignored by Git; reproduce it with the tracked Expo config and plugins followed by CocoaPods installation.

At handoff, this workspace is open in Xcode with **ValleyRide** selected and **Any iOS Device (arm64)** as the active destination. No Archive action was executed.

Do not equate a successful archive with App Store readiness: account deletion, final privacy/retention disclosures, APNs delivery and the remaining customer/payment/device checks above still need completion before submission.

Local build, device, dependency, API and artifact evidence is under `builds/ios-review-2026-10-24/`. This directory is ignored by Git and may contain device screenshots and developer metadata; do not publish it as a public artifact.

## Follow-up interaction review — 25 October 2026

The later physical-device report identified a date-range selection bug and static offer pills. These are fixed along with related app and website issues; see [the interaction review](INTERACTION-REVIEW-2026-10-25.md) for evidence and the limits of automated/native verification. Current native artifact details are in [the prototype handoff](PROTOTYPE-TESTING.md).

The final signed Release build was installed and launched on 25 October. The user confirmed that both date selection and offer selection now update the dates and price on the physical iPhone. No archive/upload or payment was performed.

