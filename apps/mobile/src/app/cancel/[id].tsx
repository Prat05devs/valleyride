import type { BookingDTO, CancellationRefund } from '@valleyride/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Chip, Divider, ErrorText, Line, Loading, T } from '@/components/ui';
import { api, ApiError, newIdempotencyKey } from '@/lib/api';
import { shortName } from '@/lib/bikes';
import { useBooking, useModels } from '@/lib/data';
import { fmtDateTime, inr } from '@/lib/format';
import { colors, fonts, radius } from '@/theme';

const REASONS = ['Plans changed', 'Weather', 'Found another ride', 'Something else'];

/** Bottom sheet over the trip (presented as a transparent modal). */
export default function Cancel() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { booking, error: bookingError, reload } = useBooking(id);
  const { byId } = useModels();
  const [preview, setPreview] = useState<{ cancellable: boolean; refund: CancellationRefund | null } | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = useRef(newIdempotencyKey()); // same key on a retry, so a refund is never sent twice
  useEffect(() => { setError(null); api.get<typeof preview>(`/bookings/${id}/cancel`).then(setPreview).catch((e) => setError(e.message)); }, [id, attempt]);

  const close = () => router.back();
  async function confirm() {
    setBusy(true); setError(null);
    try {
      await api.post<{ booking: BookingDTO }>(`/bookings/${id}/cancel`, { reason: reason ?? undefined }, { idempotencyKey: key.current });
      router.dismissTo('/(tabs)/trips');
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not cancel'); } finally { setBusy(false); }
  }

  const model = booking && byId(booking.vehicleModelId);
  const r = preview?.refund;
  const hold = booking?.status === 'PENDING_PAYMENT';
  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable accessibilityLabel="Close" onPress={close} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        {!booking || !preview ? (error || bookingError ? <><ErrorText error={error || bookingError} /><Button label="Try again" onPress={() => { void reload(); setAttempt((n) => n + 1); }} /><Button label="Back" variant="ghost" onPress={close} /></> : <Loading />) : (
          <>
            <T v="title">{hold ? 'Release this hold?' : 'Cancel this booking?'}</T>
            <T style={{ color: colors.muted }}>{model ? `${shortName(model.name)} · ` : ''}{fmtDateTime(booking.startAt)}. The bike goes back on sale straight away.</T>
            {r && (
              <View style={styles.box}>
                <Line label="Deposit" value={`${inr(r.depositRefundPaise, { decimals: 'always' })} back`} />
                <Line label="Rental" sub={r.pct === 100 ? 'Full refund, more than 24 h before pickup' : `${r.pct}% back within 24 h of pickup`} value={`${inr(r.rentalRefundPaise, { decimals: 'always' })} of ${inr(r.rentalPaidPaise, { decimals: 'always' })}`} />
                <Divider />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T style={{ fontSize: 17 }}>You get back</T><T style={{ fontFamily: fonts.medium, fontSize: 20 }}>{inr(r.refundPaise, { decimals: 'always' })}</T></View>
                <T v="label">Refunds go to the UPI or card you paid with.</T>
              </View>
            )}
            {hold && <T v="label">Nothing has been charged for this hold.</T>}
            {!preview.cancellable && <ErrorText error="This booking can no longer be cancelled in the app. Please contact support." />}
            {!hold && preview.cancellable && (
              <View style={{ gap: 8 }}>
                <T v="label">Why are you cancelling? (optional)</T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {REASONS.map((l) => <Chip key={l} label={l} tone="field" selected={reason === l} onPress={() => setReason(reason === l ? null : l)} />)}
                </View>
              </View>
            )}
            <ErrorText error={error} />
            <Button label={hold ? 'Release hold' : 'Cancel booking'} loading={busy} disabled={!preview.cancellable} onPress={confirm} />
            <Button label={hold ? 'Keep the hold' : 'Keep my booking'} variant="ghost" size="md" onPress={close} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: 20, paddingTop: 10, gap: 14 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: 6 },
  box: { backgroundColor: colors.field, borderRadius: 22, padding: 16, gap: 10 },
});
