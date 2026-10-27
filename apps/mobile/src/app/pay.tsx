import type { PaymentResultDTO } from '@valleyride/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { BackButton, Button, Card, ErrorText, Line, Notice, T } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useBooking, useCountdown } from '@/lib/data';
import { inr } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors } from '@/theme';
import { openPaymentCheckout } from '@/lib/razorpay';

/** `prevEnd` is set when paying for an extension: success is the booking's end time moving past it. */
type Params = { bookingId: string; orderId: string; amount: string; code: string; hold: string; prevEnd?: string };
type Stage = 'checkout' | 'confirming' | 'slow' | 'refunded';

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
  const [busy, setBusy] = useState<'captured' | 'failed' | 'checkout' | null>(null);
  const hold = useCountdown(p.hold || null);
  const mock = __DEV__ && p.orderId?.startsWith('order_mock_');
  const amount = Number(p.amount);

  const extension = !!p.prevEnd;
  const { booking, reload, error: bookingError } = useBooking(p.bookingId, {
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
    else if (booking.status === 'EXPIRED' || booking.status === 'CANCELLED') {
      done.current = true;
      // Paid after the hold ended: the API refunds the payment, and the screen says so instead of "you weren't charged".
      router.replace({ pathname: '/hold-expired', params: { bookingId: booking.id, ...(stage !== 'checkout' && { paid: '1' }) } });
    }
  }, [booking, extension, stage, p.prevEnd]);

  /** An extension paid for after someone else booked the bike is refunded by the API; there is nothing to wait for. */
  const settle = (result: PaymentResultDTO | null) => {
    if (extension && result?.paymentRefunded) { done.current = true; setStage('refunded'); return; }
    reload();
  };

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
      const result = await api.post<PaymentResultDTO>('/dev/payments/simulate', { orderId: p.orderId, outcome });
      if (outcome === 'captured') { setStage('confirming'); settle(result); } else failed('The test payment was declined.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the API');
    } finally { setBusy(null); }
  }

  async function pay() {
    setBusy('checkout'); setError(null);
    try {
      const result = await openPaymentCheckout({ orderId: p.orderId, amount, code: p.code,
        phone: user?.phone ?? '', name: user?.fullName ?? '', email: user?.email ?? '' });
      setStage('confirming');
      // Confirmation comes from verified provider data; the webhook also handles interrupted callbacks.
      await api.post<PaymentResultDTO>('/payments/verify', { orderId: result.razorpay_order_id,
        paymentId: result.razorpay_payment_id, signature: result.razorpay_signature }).then(settle).catch(() => {});
    } catch (e) {
      const reason = e as { code?: number; description?: string; message?: string };
      if (reason.code !== 2) setError(reason.description || reason.message || 'Could not start the payment. Please try again.');
    } finally { setBusy(null); }
  }

  if (stage === 'refunded') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 }}>
        <Icon name="calendar" size={40} />
        <T v="title" style={{ textAlign: 'center' }}>Your trip was not extended</T>
        <T style={{ textAlign: 'center', color: colors.muted }}>
          Someone booked your bike for that time while you were paying. We are refunding the full amount to the UPI or card you paid with; refunds usually take 5–7 working days.
        </T>
        <Button label="Back to your trip" onPress={() => router.replace({ pathname: '/trip/[id]', params: { id: p.bookingId } })} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  if (stage !== 'checkout') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 }}>
        {stage === 'confirming' ? <ActivityIndicator size="large" color={colors.ink} /> : <Icon name="clock" size={40} />}
        <T v="title" style={{ textAlign: 'center' }}>{stage === 'confirming' ? 'Confirming your payment' : 'Still confirming'}</T>
        <T style={{ textAlign: 'center', color: colors.muted }}>
          {stage === 'confirming'
            ? 'This usually takes a few seconds. Please keep the app open.'
            : 'We are checking the payment status with Razorpay. Your trip will show as Confirmed in Trips as soon as it arrives.'}
        </T>
        {stage === 'slow' && <Button label="Check again" variant="secondary" onPress={reload} />}
        {stage === 'slow' && <Button label="Go to Trips" onPress={() => router.replace('/(tabs)/trips')} style={{ alignSelf: 'stretch' }} />}
      </View>
    );
  }

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
            <Button label="Simulate a successful payment" loading={busy === 'captured'} disabled={!!busy || !booking || !!bookingError} onPress={() => simulate('captured')} />
            <Button label="Simulate a declined payment" variant="secondary" loading={busy === 'failed'} disabled={!!busy || !booking || !!bookingError} onPress={() => simulate('failed')} />
          </Card>
        ) : (
          <Button label={`Pay ${inr(amount, { decimals: 'always' })}`} loading={busy === 'checkout'} disabled={!!busy || !booking || !!bookingError} onPress={pay} />
        )}
        <ErrorText error={bookingError ?? error} />
        {bookingError && <Button label="Check booking again" onPress={reload} />}
      </View>
    );
}
