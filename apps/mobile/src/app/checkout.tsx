import type { BookingDTO, Quote } from '@valleyride/shared';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { BackButton, Button, Card, Divider, ErrorText, Line, Loading, Notice, T } from '@/components/ui';
import { api, ApiError, newIdempotencyKey } from '@/lib/api';
import { bikePhoto } from '@/lib/bikes';
import { fmtDate, fmtTime, inr } from '@/lib/format';
import { useTrip } from '@/lib/trip';
import { colors, fonts } from '@/theme';

type Q = Quote & { couponCode: string | null; couponValid: boolean | null };

export default function Checkout() {
  const { modelId, slug } = useLocalSearchParams<{ modelId: string; slug: string }>();
  const insets = useSafeAreaInsets();
  const t = useTrip();
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState<string | undefined>();
  const [q, setQ] = useState<Q | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = useRef(newIdempotencyKey());

  const body = () => ({
    vehicleModelId: modelId, pickupLocationId: t.pickupId, returnLocationId: t.returnId ?? t.pickupId,
    startAt: t.startAt.toISOString(), endAt: t.endAt.toISOString(), couponCode: applied,
  });

  useEffect(() => {
    api.post<Q>('/quotes', body()).then(setQ).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not price this trip'));
  }, [applied]); // eslint-disable-line react-hooks/exhaustive-deps

  async function pay() {
    setBusy(true); setError(null);
    try {
      const res = await api.post<{ booking: BookingDTO; razorpayOrderId: string }>('/bookings', body(), { idempotencyKey: key.current });
      router.replace({ pathname: '/pay', params: { bookingId: res.booking.id, orderId: res.razorpayOrderId, amount: String(res.booking.totalPaise), code: res.booking.code, hold: res.booking.holdExpiresAt ?? '' } });
    } catch (e) {
      key.current = newIdempotencyKey();
      setError(e instanceof ApiError ? e.message : 'Could not start the payment');
    } finally { setBusy(false); }
  }

  if (!q) return error ? <SafeAreaView style={{ flex: 1, padding: 20 }}><BackButton /><ErrorText error={error} /></SafeAreaView> : <Loading />;
  const tierOff = Math.round(q.rentalPaise * q.tierPct / 100);
  const couponOff = q.discountPaise - tierOff; // quote() puts tier and coupon together in discountPaise

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, gap: 14, paddingBottom: 170 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><BackButton /><T v="title">Review &amp; pay</T></View>
        <Notice icon="timer" text="When you continue, we hold the bike for 15 minutes while you pay." />
        <Card style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 14 }}>
          <View style={styles.thumb}><Image source={bikePhoto(slug)} style={{ width: 92, height: 64 }} contentFit="contain" /></View>
          <View style={{ flex: 1 }}>
            <T style={{ fontSize: 17 }}>{fmtDate(t.startAt)}, {fmtTime(t.startAt)} → {fmtDate(t.endAt)}</T>
            <T v="label">{t.pickup?.name}{t.oneWay ? ` → ${t.returnPoint?.name}` : ''} · {q.kmIncluded} km included</T>
          </View>
        </Card>
        <Card style={{ gap: 12, padding: 20 }}>
          <T style={{ fontSize: 18 }}>Price details</T>
          <Line label={`Rental · ${q.days} ${q.days === 1 ? 'day' : 'days'}`} value={inr(q.rentalPaise, { decimals: 'always' })} />
          {q.tierPct > 0 && <Line label={`Long-rental discount · ${q.tierPct}%`} value={'−' + inr(tierOff, { decimals: 'always' })} />}
          {q.couponCode && <Line label={`Coupon ${q.couponCode}`} value={'−' + inr(couponOff, { decimals: 'always' })} />}
          {q.feesPaise > 0 && <Line label="One-way fee" value={inr(q.feesPaise, { decimals: 'always' })} />}
          <Line label="GST · 18%" value={inr(q.taxPaise, { decimals: 'always' })} />
          <Divider />
          <Line label="Rental total" value={inr(q.totalPaise, { decimals: 'always' })} strong />
          <Line label="Refundable deposit" sub="Returned after the return inspection" value={inr(q.depositPaise, { decimals: 'always' })} />
          <Divider />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><T style={{ fontSize: 18 }}>Pay now</T><T style={{ fontFamily: fonts.medium, fontSize: 24 }}>{inr(q.payNowPaise, { decimals: 'always' })}</T></View>
        </Card>
        <View style={{ gap: 8 }}>
          <T v="label" style={{ paddingLeft: 4 }}>Coupon</T>
          <View style={styles.coupon}>
            <Icon name="ticket" size={20} />
            <TextInput value={coupon} onChangeText={(v) => setCoupon(v.toUpperCase())} autoCapitalize="characters" placeholder="Enter a code" placeholderTextColor={colors.disabled}
              accessibilityLabel="Coupon code" style={styles.couponInput} />
            <Button label={applied ? 'Remove' : 'Apply'} size="sm" style={{ height: 46 }} disabled={!applied && !coupon}
              onPress={() => { if (applied) { setApplied(undefined); setCoupon(''); } else setApplied(coupon.trim()); }} />
          </View>
          {applied && q.couponValid === false && <ErrorText error="That coupon isn't valid or has expired." />}
        </View>
        <ErrorText error={error} />
      </ScrollView>
      <Glass radius={0} style={[styles.bar, { paddingBottom: insets.bottom + 14 }]}>
        <Button label={`Pay ${inr(q.payNowPaise, { decimals: 'always' })}`} loading={busy} onPress={pay} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}><Icon name="lock" size={16} color={colors.muted} /><T v="label">UPI, cards and net banking via Razorpay</T></View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 104, height: 74, borderRadius: 18, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  coupon: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 58, paddingLeft: 18, paddingRight: 6, borderRadius: 999, backgroundColor: colors.surface },
  couponInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, letterSpacing: 1, color: colors.ink },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 10, paddingHorizontal: 20, paddingTop: 14 },
});
