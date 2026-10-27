# App and website interaction review — 25 October 2026

The reported date picker blocked the booking flow: after clearing the return date, every subsequent tap reset pickup again. The discount pills on the mobile bike page were informational views with no tap handler. Both behaviors are fixed. Choosing an offer now sets the return date to its minimum rental duration and requests the API's price; it does not create a booking or apply an invented client-side price.

This remains a client prototype. It connects to production in native Release builds. The automated interaction tests use an isolated local API with public catalog fixtures and cannot create production bookings, change production accounts, or charge money.

## Findings and changes

| Priority | Flow | Evidence and user impact | Implemented change |
| --- | --- | --- | --- |
| P1 | Mobile dates | `end === null` continually restarted selection; Done stayed disabled | A pickup tap starts a range; the next return tap completes it. Same-day rentals are allowed when times meet the four-hour minimum. |
| P1 | Offers | Mobile discount pills were static `Tag` views | Interactive offer chips update the return date and fetch a new quote. Website bike pages now offer the same shortcuts. |
| P1 | Search results | Earlier asynchronous searches could overwrite newer dates | Ignore superseded results, clear old availability while loading, and provide retry. |
| P1 | Website bike availability | Request omitted the chosen pickup; bikes at another point could appear available | Include pickup in request parameters and query key. |
| P1 | Coupon/checkout | Price refreshes could finish out of order; Pay stayed enabled during repricing | Track pending pricing, ignore obsolete responses and disable Pay until the current quote arrives. |
| P1 | Failed booking requests | Trip, pickup, extension, confirmation and deposit screens could spin indefinitely | Show an error, Back and Try again. Cancellation preview failures also leave recovery controls. |
| P2 | Date/time entry | Return fields opened pickup mode; clock fields opened the top of the calendar; date labels truncated | Pass the selected endpoint, scroll clock entry to time controls, wrap dates, and provide six months. |
| P2 | Pickup-point loading | An initial location request failure left core screens waiting indefinitely | Expose a location-load error and retry on search, pickup-point, rides and bike screens. |
| P2 | Empty states | Payment, notification and route request failures appeared as legitimate empty lists | Show failure and retry rather than claiming no payments, no notifications or no routes. |
| P2 | Documents and Explore | Failed document loads could imply that saved documents were missing; Explore could remain blank after a fleet request failed | Keep load failures distinct from missing records, block premature replacement forms, and add retry. Document-photo copy now distinguishes masked typed numbers from unmasked photos. |
| P2 | Mobile navigation | Capital opened the nonexistent `/capital` | Link to the website's `/invest` route. |
| P2 | Unavailable rides | Grey bike cards could not be opened to inspect details or change dates | Keep details accessible while disabling Book now for unavailable inventory. |
| P2 | Website dates | Clearing inputs or entering past dates could produce invalid requests or silently disabled controls | Validate missing, invalid, past and short windows; show the reason and prevent requests. |
| P2 | Agreement download | Opening a window after awaiting a request could be blocked; failures were silent | Open the window from the user gesture, show request failure, and recover if popups are blocked. |
| P2 | One-way directions | Website ongoing-trip directions still used pickup coordinates | Use the return point for an ongoing one-way trip. |
| P2 | Admin fleet | Status failures were unhandled; Add vehicle allowed repeated submission | Show errors and pending state; disable controls during writes and while required options are unavailable. |
| P2 | Calculator | Failed requests left unexplained dashes | Show invalid-input, loading and retry states. |
| P2 | Accessibility | React Native web preview did not expose several selected/expanded/checked states | Add web-compatible ARIA states while retaining native accessibility states and actual disabled buttons. |

## Flow coverage

- Mobile: sign-in/keyboard (earlier physical-device check); Explore → bike → pickup/return → date/time → rides → bike → offers → checkout/coupon. Trips tabs, profile edit, Help FAQ, route guide, menu/Capital, payments and failed booking/deposit/pickup/extension/confirmation/cancellation loading.
- Website: home search → results/filter/sort; fleet → bike dates/offer/availability; route guide; Capital calculator; protected-page redirects; account profile/payments; admin Add vehicle and registration search.
- Source review: native mobile navigation and customer lifecycle screens, website public/account/admin/investor pages, shared controls and request handlers. A syntax-tree scan checks button wiring across 113 TSX files; it is a triage check, not proof that every backend operation succeeds.

## Verification

- **31 browser interaction checks passed**: mobile React Native web preview at iPhone 15, iPhone SE and Pixel 7 sizes; Next.js website at desktop and phone sizes, all using Chromium on this Mac. These are viewport simulations, not native iOS/Android or Safari execution.
- **7 date/offer state regressions passed**; **2 website time-window regressions passed**; **2 decoder/security regressions passed**.
- Mobile and website TypeScript checks and website ESLint passed.
- Browser results: ignored local `builds/interaction-review/baseline-31-results.json` and `results.json`; wiring scan: `builds/interaction-review/control-scan.json`.

To rerun: build the shared package, use Node 24, then run `pnpm --filter @valleyride/e2e e2e:interactions`. The interaction configuration starts its own fixture API, Expo preview and Next.js preview. Install Playwright Chromium if needed; `INTERACTION_BROWSER_PATH` can select an already installed browser. The normal integration suite remains separate because it requires its own database/Redis stack.

## Limits

The automated suite does not exercise native camera/photo upload, signing on glass, VoiceOver/TalkBack, APNs/FCM delivery, Razorpay/UPI/bank outcomes or real staff financial/vehicle writes. Those still need physical-device and service integration checks. Account deletion and final privacy disclosures remain deferred as agreed for the prototype. Native rebuild/artifact status is recorded in `PROTOTYPE-TESTING.md`.
