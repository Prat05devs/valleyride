import type { BookingDTO, Quote } from '@valleyride/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { BackButton, Button, Card, Divider, ErrorText, Line, Loading, Notice, Row, T } from '@/components/ui';
import { api, ApiError, newIdempotencyKey } from '@/lib/api';
import { shortName } from '@/lib/bikes';
import { tierNote, useTiers } from '@/lib/copy';
import { useBooking, useModels } from '@/lib/data';
import { fmtDateTime, inr } from '@/lib/format';
import { colors, fonts } from '@/theme';

type Preview = { available: boolean; quote: Quote; payPaise: number };
const ADD = [1, 2, 3, 4];

export default function Extend() {
  const tiers = useTiers();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { booking } = useBooking(id);
  const { byId } = useModels();
  const [add, setAdd] = useState(1);
  const [previews, setPreviews] = useState<Record<number, Preview | 'error'>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = useRef(newIdempotencyKey());

  const endFor = (b: BookingDTO, n: number) => new Date(new Date(b.endAt).getTime() + n * 86_400_000);
  useEffect(() => {
    if (!booking) return;
    ADD.forEach((n) => {
      api.get<Preview>(`/bookings/${booking.id}/extend?endAt=${encodeURIComponent(endFor(booking, n).toISOString())}`)
        .then((p) => setPreviews((s) => ({ ...s, [n]: p })))
        .catch(() => setPreviews((s) => ({ ...s, [n]: 'error' })));
    });
  }, [booking]);

  if (!booking) return <Loading />;
  const model = byId(booking.vehicleModelId);
  const p = previews[add];
  const ready = p && p !== 'error' ? p : null;
  const newEnd = endFor(booking, add);

  async function extend() {
    if (!booking || !ready) return;
    setBusy(true); setError(null);
    try {
      const res = await api.post<{ booking: BookingDTO; razorpayOrderId: string | null; payPaise: number }>(`/bookings/${booking.id}/extend`, { endAt: newEnd.toISOString() }, { idempotencyKey: key.current });
      if (!res.razorpayOrderId) { router.back(); return; }
      router.replace({ pathname: '/pay', params: { bookingId: booking.id, orderId: res.razorpayOrderId, amount: String(res.payPaise), code: booking.code, hold: '', prevEnd: booking.endAt } });
    } catch (e) {
      key.current = newIdempotencyKey();
      setError(e instanceof ApiError ? e.message : 'Could not extend');
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: 170, gap: 14 }}>
        <Row><BackButton /><T v="title">Extend trip</T></Row>
        <Card style={{ gap: 12 }}>
          <Line label="Return now" value={fmtDateTime(booking.endAt)} muted />
          <Line label="New return" value={fmtDateTime(newEnd)} strong />
        </Card>
        <T v="label" style={{ paddingLeft: 4 }}>Add days · same {fmtDateTime(booking.endAt).split(', ')[1]} return time</T>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {ADD.map((n) => {
            const on = n === add;
            return (
              <Pressable key={n} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setAdd(n)}
                style={[styles.opt, { backgroundColor: on ? colors.ink : colors.surface }]}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 20, color: on ? colors.surface : colors.ink }}>+{n}</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: on ? 'rgba(255,255,255,0.8)' : colors.muted }}>
                  {endFor(booking, n).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {ready && <Notice icon="ticket" text={tierNote(ready.quote.days, tiers)} />}
        <Card style={{ gap: 12, padding: 20 }}>
          <T style={{ fontSize: 18 }}>What changes</T>
          {!p ? <Loading /> : p === 'error' ? <ErrorText error="Could not price these dates." /> : (
            <>
              <Line label="Trip length" value={`${booking.billableDays} → ${p.quote.days} days`} />
              <Line label="Km included" value={`${booking.kmIncluded} → ${p.quote.kmIncluded} km`} />
              <Line label="New rental total, incl. GST" value={inr(p.quote.totalPaise, { decimals: 'always' })} />
              <Line label="Already paid" value={'−' + inr(booking.totalPaise - booking.depositPaise, { decimals: 'always' })} muted />
              <Divider />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <T style={{ fontSize: 18 }}>Pay now</T><T style={{ fontFamily: fonts.medium, fontSize: 24 }}>{inr(p.payPaise, { decimals: 'always' })}</T>
              </View>
              <T v="label">The {inr(booking.depositPaise)} deposit stays the same.{p.payPaise === 0 ? ' The longer trip costs no more, so there is nothing to pay.' : ''}</T>
            </>
          )}
        </Card>
        {ready && (
          <Row gap={8} style={{ paddingHorizontal: 4 }}>
            <Icon name={ready.available ? 'check' : 'info'} size={18} color={ready.available ? colors.ink : colors.orangeInk} />
            <T v="label" style={{ color: ready.available ? colors.ink : colors.orangeInk }}>
              {ready.available ? `Your ${model ? shortName(model.name) : 'bike'} is free for these dates` : 'Your bike is booked by someone else for these dates'}
            </T>
          </Row>
        )}
        <ErrorText error={error} />
      </ScrollView>
      <Glass radius={0} style={[styles.bar, { paddingBottom: insets.bottom + 14 }]}>
        <Button label={ready ? (ready.payPaise ? `Pay ${inr(ready.payPaise, { decimals: 'always' })} and extend` : 'Extend trip') : 'Extend trip'}
          loading={busy} disabled={!ready || !ready.available} onPress={extend} />
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  opt: { flex: 1, height: 74, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 2 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14 },
});
