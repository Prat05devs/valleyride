# Valley Ride client prototype

This handoff is for design and usability review. The user will archive/upload iOS in Xcode and will verify payment behavior directly. Account deletion, final privacy disclosures, push-delivery verification and the remaining upstream tooling advisories are deferred from this prototype task; see `IOS-REVIEW-2026-10-24.md`.

## iOS / TestFlight

- Workspace: `apps/mobile/ios/ValleyRide.xcworkspace`.
- Scheme: **ValleyRide**.
- Destination for archive: **Any iOS Device (arm64)**.
- Team: **WT IT SOLUTIONS PRIVATE LIMITED** (`9Q56J23Z23`).
- Bundle ID: `in.valleyride.app`; version 1.0.0, build 1.
- App Store primary category: **Travel**. A secondary category is optional.

Choose **Product → Archive**, then **Distribute App → App Store Connect** to upload the build. If build 1 has already been uploaded, increment the build number before archiving again. This handoff does not archive, upload, invite testers or submit a beta for review.

On 25 October the signed Release app was rebuilt, its production API configuration and signature verified, and it was installed and reopened on the user's iPhone. The user confirmed that choosing pickup/return dates and the 7+ day offer updates the dates and price. The build also includes the later document-loading recovery fixes. Local signed app and symbols: `builds/ios-review-2026-10-24/ValleyRide.app` and `ValleyRide.app.dSYM`.

Internal testers must already be eligible App Store Connect users. The first external TestFlight build requires Apple's beta review and beta test/review information; see [Apple's TestFlight guide](https://developer.apple.com/testflight/).

## Android APK

The Android artifact is a **Release** APK for **arm64-v8a** physical devices, signed with a dedicated local testing key. It is a sideloading build, not a Play Store release. Signing credentials stay in the ignored local signing directory and must not be shared with testers.

The APK embeds the JavaScript bundle and native Razorpay Android integration, uses the production HTTPS API and public site, and disables cleartext network traffic. It needs no development server or USB connection after installation.

Artifact: `builds/valley-ride-production-testing.apk` (50,826,030 bytes, approximately 49 MB). SHA-256: `a5585dfbd84fc8cba6fbf3d61c46f437b15026ae88720e19fb1b99016128b48c`.

Verified after the 25 October interaction fixes: signature and ZIP alignment valid; every bundled ARM64 ELF library supports 16 KB pages; package `in.valleyride.app`; version 1.0.0 (1); non-debuggable; cleartext traffic and Android backup disabled; no microphone or overlay permission; native Razorpay module present. Production API and website URLs are embedded, with no localhost API URL. No Android device was available for native runtime verification and no payment was made.

The date-picker, offer-selection and wider interaction changes and test coverage are described in [the interaction review](INTERACTION-REVIEW-2026-10-25.md).

If a phone has an older Valley Ride test build signed with a different key, Android may reject an update. Remove the older test build before installing this one; the tester can sign back in to the server account afterward. Do not uninstall a build containing unsaved work without saving it first.

## Suggested “What to Test” text

> This is the first Valley Ride prototype for design feedback. Please review login, Explore, fleet cards, pickup/return locations and dates, bike details, Trips, Profile, document screens and navigation. Tell us which text, layout or interaction is confusing, and include your phone model and OS version with screenshots.
>
> This build connects to live Valley Ride services. Payments use live Razorpay and may create real bookings and charges. Only continue through payment if you intend to complete a real booking. You can review the design without completing payment.

## Account notes

Use an existing production account or create a customer account. The development-only numbers/passwords in the repository do not work on production. The current booking-creation API requires a customer role; admins use the website console and can inspect the rider app's screens but should use a separate customer account for an actual rental test.

## Business details supplied for the future privacy policy

- Operator: WT IT Solutions.
- Address: Near IT Park, Sahastradhara Road, Dehradun, India.
- Contact: admin@wtsolutions.cc.

These details are recorded for the later policy work. They do not imply that the deferred deletion, retention-policy or payment/push verification work has been completed.
