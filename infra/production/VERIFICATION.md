# Verification — 22 October 2026

The application is prepared and running locally. Nothing was published to Hostinger or the DigitalOcean server.
Production credentials were not supplied, and no real payment was attempted.

| Check | Result |
| --- | --- |
| Workspace lint and TypeScript checks | Passed |
| Unit tests | 24 passed |
| API integration tests with PostgreSQL and Redis | 52 passed |
| Browser flows | 33 passed: 18 website checks, 15 React Native web-preview checks |
| Hostinger standalone build and assets | Built and served successfully |
| iOS and Android production JavaScript bundles | Exported; both contain the permanent API address and native Razorpay module, without the localhost API address |
| Android native debug APK, arm64 | Built successfully; compiled Razorpay native module verified inside the APK |
| Production API image | Built successfully |
| Production startup with Razorpay credentials blank | Readiness passes; checkout reports unavailable before reserving a vehicle |
| Empty-secret webhook forgery | Rejected by the production image |
| First-boot private database and application role | Created; all migrations pass without cluster administrator privileges |
| API/worker startup | Verified in containers |
| Static guide images, CORS, disabled production mock-payment route | Verified |
| Caddy configuration | Validated with Caddy |
| Database backup and restore | Custom-format dump restored successfully into a separate test database |

Payment tests cover signed callbacks, webhook signatures and duplicate captures, amount/currency mismatch rejection,
failure/retry after reloading checkout, runtime public-key changes, cancellation refunds and deposit settlement.
External payment APIs and widgets were simulated for these tests. Browser phone profiles exercise React Native Web;
they do not replace physical-device testing of UPI handoff, camera, signing or push notifications.

## Flow fixes

The product is an established React Native rental app for riders booking two-wheelers, with phone onboarding,
search → bike → checkout → payment → trip, plus cancellation and return flows. Existing navigation and visual design
were preserved except for presenting an explicit Pay action before opening the native payment sheet.

| Priority | Finding | Evidence and resolution |
| --- | --- | --- |
| P1 | Bike deep links could remain on the loading spinner | An unpriced availability response overwrote the priced result. Requests now wait for pickup selection and ignore obsolete responses; delayed-loading regression checks pass at three phone sizes. |
| P1 | Public payment keys were fixed at frontend build time | Website and app now fetch public configuration when checkout opens. The browser test changes keys twice without rebuilding and checks the missing-key message. |
| P1 | Reloading checkout after a failed payment lost its order | Failed attempts retain their retryable order; superseded coupon orders remain excluded. API regression test passes. |
| P1 | A capture with the wrong amount was only logged | Capture now rejects amount/currency mismatches before confirmation; regression tests pass. |

The mobile UX skill's static scan reviewed 75 files and emitted 18 P1 and 33 P2 heuristic signals, including labels,
decorative images and text truncation. Those signals are not a completed accessibility audit or confirmed defects.
VoiceOver/TalkBack, large-text and native lifecycle checks remain to be performed on devices. The existing offline
session-preservation flow passed the browser tests.

## Before live launch

- Follow [production hosting setup](README.md): GoDaddy DNS, Hostinger website, DigitalOcean access, HTTPS and real fleet data.
- Follow [payment activation](PAYMENTS.md): API key ID, matching secret, separate webhook secret, merchant activation,
  capture settings and webhook events. Complete test-mode payment and refund checks before live money.
- Supply SMS/OTP, private storage, email/support and optional WhatsApp/push account settings. These are separate from Razorpay.
- Build/sign the release apps and test native checkout/UPI on Android and iPhone. An iOS native binary was not built in this session.
- Review payments received after expired holds or conflicting extensions; the current implementation logs these exceptional
  cases for staff refund/rebooking rather than automatically resolving every case.

The Mac exhausted disk space during an earlier native build and Docker failed with virtual-disk I/O errors. After
removing generated project caches and recovering Docker, the Android build, complete browser suite and final API-image
build succeeded. Database volumes were preserved. Only the isolated verification database is removed during cleanup.
