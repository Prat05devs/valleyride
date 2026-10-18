import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Button, Card, IconButton, Notice, T } from '@/components/ui';
import { useBooking, useCountdown, useModels } from '@/lib/data';
import { fmtDate, fmtDateTime, inr } from '@/lib/format';
import { shortName } from '@/lib/bikes';
import { colors } from '@/theme';

type Params = { bookingId: string; orderId: string; amount: string; code: string; hold: string; reason?: string };

export default function PaymentFailed() {
  const p = useLocalSearchParams<Params>();
  const insets = useSafeAreaInsets();
  const { booking } = useBooking(p.bookingId);
  const { byId } = useModels();
  const hold = useCountdown(booking?.holdExpiresAt ?? (p.hold || null));
  const model = booking && byId(booking.vehicleModelId);
  const held = booking?.status === 'PENDING_PAYMENT' && hold.seconds > 0;
  const { reason: _r, ...payParams } = p;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, padding: 20, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20, gap: 16 }}>
      <View style={{ alignSelf: 'flex-end' }}><IconButton icon="x" label="Close" onPress={() => router.replace('/(tabs)/trips')} /></View>
      <View style={{ alignItems: 'center', gap: 14 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.orangeTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={36} color={colors.orangeInk} strokeWidth={2} />
        </View>
        <T v="hero" style={{ textAlign: 'center' }}>Payment didn't go through</T>
        <T style={{ color: colors.muted, textAlign: 'center' }}>{p.reason ? `${p.reason} ` : ''}Nothing was booked yet.</T>
      </View>
      {held ? <Notice icon="timer" text={`Bike still held for ${hold.text}`} /> : <Notice tone="field" icon="info" text="The hold on this bike has ended." />}
      {booking && (
        <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexShrink: 1 }}>
            <T style={{ fontSize: 17 }}>{model ? shortName(model.name) : booking.code} · {booking.billableDays} {booking.billableDays === 1 ? 'day' : 'days'}</T>
            <T v="label">{fmtDateTime(booking.startAt)} → {fmtDate(booking.endAt)}</T>
          </View>
          <T v="price">{inr(booking.totalPaise, { decimals: 'always' })}</T>
        </Card>
      )}
      <View style={{ flex: 1 }} />
      {held
        ? <Button label="Try again" onPress={() => router.replace({ pathname: '/pay', params: payParams })} />
        : <Button label="Check availability again" onPress={() => router.replace('/rides')} />}
      <Button label="Money left my account" variant="ghost" onPress={() => router.push('/(tabs)/help')} />
    </View>
  );
}
