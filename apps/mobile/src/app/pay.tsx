import type { BookingDTO } from '@valleyride/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Icon } from '@/components/Icon';
import { BackButton, Button, Card, ErrorText, Line, Notice, T } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useBooking, useCountdown } from '@/lib/data';
import { inr } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors } from '@/theme';

const KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';

/** `prevEnd` is set when paying for an extension: success is the booking's end time moving past it. */
type Params = { bookingId: string; orderId: string; amount: string; code: string; hold: string; prevEnd?: string };
type Stage = 'checkout' | 'confirming' | 'slow';

/**
 * Pays the Razorpay order for a held booking. The booking is confirmed by the payment.captured webhook,
 * so after Checkout reports success this screen polls GET /bookings/:id until it is CONFIRMED.
 */
export default function Pay() {
  const p = useLocalSearchParams<Params>();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const [stage, setStage] = useState<Stage>('checkout');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'captured' | 'failed' | null>(null);
  const hold = useCountdown(p.hold || null);
  const mock = p.orderId?.startsWith('order_mock_');
  const amount = Number(p.amount);

  const extension = !!p.prevEnd;
  const { booking, reload } = useBooking(p.bookingId, {
    pollMs: stage === 'checkout' ? 0 : 2000,
    keepPolling: (b) => (extension ? b.endAt === p.prevEnd : b.status === 'PENDING_PAYMENT'),
  });
  const done = useRef(false);

  useEffect(() => {
    if (!booking || done.current) return;
    if (extension) {
      if (stage !== 'checkout' && booking.endAt !== p.prevEnd) { done.current = true; router.replace({ pathname: '/trip/[id]', params: { id: booking.id } }); }
      return;
    }
    if (booking.status === 'CONFIRMED') { done.current = true; router.replace({ pathname: '/confirmed/[id]', params: { id: booking.id } }); }
    else if (booking.status === 'EXPIRED' || booking.status === 'CANCELLED') { done.current = true; router.replace({ pathname: '/hold-expired', params: { bookingId: booking.id } }); }
  }, [booking, extension, stage, p.prevEnd]);

  useEffect(() => {
    if (stage !== 'confirming') return;
    const h = setTimeout(() => setStage('slow'), 45_000);
    return () => clearTimeout(h);
  }, [stage]);

  useEffect(() => {
    if (p.hold && hold.seconds === 0 && stage === 'checkout' && !done.current) {
      done.current = true;
      router.replace({ pathname: '/hold-expired', params: { bookingId: p.bookingId } });
    }
  }, [hold.seconds, p.hold, p.bookingId, stage]);

  const failed = (reason?: string) => {
    if (extension) { setError(reason || 'The payment did not go through. Your trip was not changed.'); setStage('checkout'); return; }
    router.replace({ pathname: '/payment-failed', params: { ...p, reason: reason ?? '' } });
  };

  async function simulate(outcome: 'captured' | 'failed') {
    setBusy(outcome); setError(null);
    try {
      await api.post<BookingDTO>('/dev/payments/simulate', { orderId: p.orderId, outcome });
      if (outcome === 'captured') setStage('confirming'); else failed('The test payment was declined.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the API');
    } finally { setBusy(null); }
  }

  function onMessage(e: WebViewMessageEvent) {
    const msg = JSON.parse(e.nativeEvent.data) as { type: 'success' | 'failed' | 'dismiss'; reason?: string; orderId?: string; paymentId?: string; signature?: string };
    if (msg.type === 'success') {
      setStage('confirming');
      // Confirm straight away from the signed result; the webhook confirms too if this call never lands.
      api.post('/payments/verify', { orderId: msg.orderId, paymentId: msg.paymentId, signature: msg.signature }).then(() => reload()).catch(() => {});
    }
    else if (msg.type === 'failed') failed(msg.reason);
    else if (router.canGoBack()) router.back(); else router.replace('/(tabs)/trips');
  }

  const html = useMemo(() => checkoutHtml({
    key: KEY_ID, orderId: p.orderId, amount, code: p.code, phone: user?.phone ?? '', name: user?.fullName ?? '', email: user?.email ?? '',
  }), [p.orderId, amount, p.code, user]);

  if (stage !== 'checkout') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 }}>
        {stage === 'confirming' ? <ActivityIndicator size="large" color={colors.ink} /> : <Icon name="clock" size={40} />}
        <T v="title" style={{ textAlign: 'center' }}>{stage === 'confirming' ? 'Confirming your payment' : 'Still confirming'}</T>
        <T style={{ textAlign: 'center', color: colors.muted }}>
          {stage === 'confirming'
            ? 'This usually takes a few seconds. Please keep the app open.'
            : 'Razorpay has your payment and we are waiting for its confirmation. Your trip will show as Confirmed in Trips as soon as it arrives.'}
        </T>
        {stage === 'slow' && <Button label="Go to Trips" onPress={() => router.replace('/(tabs)/trips')} style={{ alignSelf: 'stretch' }} />}
      </View>
    );
  }

  if (mock || Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, padding: 20, paddingTop: insets.top + 8, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><BackButton /><T v="title">Pay</T></View>
        {p.hold ? <Notice icon="timer" text={`Bike held for ${hold.text}. Finish paying before the timer runs out.`} /> : null}
        <Card style={{ gap: 12, padding: 20 }}>
          <Line label={extension ? `Extension · ${p.code}` : `Booking ${p.code}`} value={inr(amount, { decimals: 'always' })} strong />
          <T v="label">{extension ? 'The difference for the longer trip, incl. GST.' : 'Rental, GST and refundable deposit in one payment.'}</T>
        </Card>
        {mock ? (
          <Card style={{ gap: 12, padding: 20 }}>
            <T style={{ fontSize: 18 }}>Test payment</T>
            <T v="label">Razorpay keys aren't set, so the API is in mock mode. These buttons run the same capture code as the Razorpay webhook.</T>
            <Button label="Simulate a successful payment" loading={busy === 'captured'} disabled={!!busy} onPress={() => simulate('captured')} />
            <Button label="Simulate a declined payment" variant="secondary" loading={busy === 'failed'} disabled={!!busy} onPress={() => simulate('failed')} />
          </Card>
        ) : (
          <Notice tone="field" icon="info" text="Razorpay Checkout runs in the iOS and Android apps. Use the website to pay from a browser." />
        )}
        <ErrorText error={error} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top }}>
      <WebView
        source={{ html, baseUrl: 'https://valleyride.in' }}
        onMessage={onMessage}
        originWhitelist={['*']}
        javaScriptEnabled
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.ink} /></View>}
        onError={() => setError('Could not load Razorpay. Check your connection.')}
      />
      {error ? <View style={{ padding: 20 }}><ErrorText error={error} /></View> : null}
    </View>
  );
}

/** A blank page that opens Razorpay Checkout straight away and reports the outcome back to React Native. */
function checkoutHtml(o: { key: string; orderId: string; amount: number; code: string; phone: string; name: string; email: string }) {
  const opts = {
    key: o.key, order_id: o.orderId, amount: o.amount, currency: 'INR',
    name: 'Valley Ride', description: `Booking ${o.code}`,
    prefill: { contact: o.phone, name: o.name, email: o.email },
    theme: { color: '#000000' },
  };
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script></head>
<body style="margin:0;background:#fff">
<script>
  function send(m){ window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  var opts = ${JSON.stringify(opts)};
  opts.handler = function(r){ send({ type: 'success', orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }); };
  opts.modal = { ondismiss: function(){ send({ type: 'dismiss' }); }, confirm_close: true };
  var rzp = new Razorpay(opts);
  rzp.on('payment.failed', function(r){ send({ type: 'failed', reason: (r && r.error && r.error.description) || '' }); });
  rzp.open();
</script></body></html>`;
}
