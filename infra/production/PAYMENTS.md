# Activate Razorpay payments

Payment setup is centralized on the backend. The website and the updated mobile app fetch the public key from
`GET /api/v1/payments/config` when checkout opens. API and webhook secrets stay on the server. Adding the keys later
does not require rebuilding the website or releasing the app again, once the updated app has been installed.

## Credentials to add later

In the VPS `infra/production/.env`, fill:

```dotenv
RAZORPAY_KEY_ID=rzp_test_<your_test_key_id>
RAZORPAY_KEY_SECRET=<the_matching_test_key_secret>
RAZORPAY_WEBHOOK_SECRET=<a_separate_random_secret_used_in_the_webhook_dashboard>
```

Test first with test-mode keys; use matching live-mode keys after Razorpay activates the account. Never put either
secret in a `NEXT_PUBLIC_` or `EXPO_PUBLIC_` variable. All three values are needed for configured checkout. With them
empty, production stays up for browsing but rejects payment booking requests before reserving a bike. Mock payments
are available only in local development, never in production.

## Dashboard configuration

In the matching test/live mode on Razorpay:

1. Configure automatic capture of payments for Orders API checkout.
2. Add webhook URL **`https://api.valleyride.in/api/v1/webhooks/razorpay`**.
3. Enter the same independent webhook secret used in `RAZORPAY_WEBHOOK_SECRET`.
4. Subscribe to **`payment.captured`**, **`payment.failed`**, **`refund.processed`**, **`refund.failed`**.
5. Complete merchant activation and required website/policy details before accepting live money.

DNS and HTTPS must be live before Razorpay can deliver events. Keys alone cannot establish hosting, HTTPS or merchant
activation. The API verifies webhook signatures against the exact request body, rejects amount/currency mismatches,
and makes repeated capture processing harmless. Signed checkout callbacks are also checked against fetched provider data.

## Apply and check

Changing a running container's environment file requires recreation, not just `docker restart`:

```sh
cd /opt/apps/valleyride/infra/production
docker compose up -d --wait api worker
curl --fail https://api.valleyride.in/api/v1/payments/config
```

Expect `enabled: true`, the correct **public** key ID, `mode: test` or `mode: live`, and `currency: INR`. Missing/placeholder
credentials produce `enabled: false`, `keyId: null`, `mode: unconfigured`. This reports configuration presence; the first
provider-backed test payment confirms that the credentials themselves are valid.

Run a real Razorpay test-mode payment on the website and on rebuilt Android/iOS apps. Check success, failure, dismissal,
retry, returning from a UPI app, losing connection after paying, the booking becoming confirmed, an extension payment,
and a cancellation/deposit refund. The worker must run for confirmations/invoices and reminders. Verify webhook delivery
and signature processing in Razorpay's event logs. Staff must review any money captured after a booking expires or any
extension conflict; those exceptional cases are logged for refund/rebooking in the current implementation.

The native SDK was added in this change, so the app needs a fresh native build once (Expo prebuild/EAS Build);
an older WebView-based binary will not gain the SDK from a backend configuration change. Expo Go does not include this
custom native module. Later key additions use runtime configuration and need no new binary.

## Verification limits

Local tests use a simulated provider and signed fixtures. They verify application behavior, not settlement or live
credential validity. A test-mode transaction, native UPI return and a real refund must still be checked once keys and
hosting exist. Do not accept live money before those checks pass.

References: [Razorpay Android integration](https://razorpay.com/docs/payments/payment-gateway/react-native-integration/standard/integration-steps-android),
[Razorpay iOS integration and UPI schemes](https://razorpay.com/docs/payments/payment-gateway/react-native-integration/standard/integration-steps-ios),
[Razorpay payment dashboard](https://razorpay.com/docs/payments/payments/dashboard/).
