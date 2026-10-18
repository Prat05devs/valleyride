import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Button, Card, IconButton, T } from '@/components/ui';
import { useBooking, useModels } from '@/lib/data';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { shortName } from '@/lib/bikes';
import { useTrip } from '@/lib/trip';
import { colors } from '@/theme';

export default function HoldExpired() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const insets = useSafeAreaInsets();
  const { booking } = useBooking(bookingId);
  const { byId } = useModels();
  const trip = useTrip();
  const model = booking && byId(booking.vehicleModelId);
  const where = trip.locations.find((l) => l.id === booking?.pickupLocationId) ?? trip.pickup;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, padding: 20, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20, gap: 16 }}>
      <View style={{ alignSelf: 'flex-end' }}><IconButton icon="x" label="Close" onPress={() => router.replace('/')} /></View>
      <View style={{ alignItems: 'center', gap: 14 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}><Icon name="timer" size={38} /></View>
        <T v="hero">Your hold ended</T>
        <T style={{ color: colors.muted, textAlign: 'center', lineHeight: 22 }}>
          We keep a bike for 15 minutes while you pay. The time ran out, so the {model ? shortName(model.name) : 'bike'} was released. You weren't charged.
        </T>
      </View>
      <Card style={{ gap: 4 }}>
        <T v="label">Your search</T>
        <T style={{ fontSize: 17 }}>{booking ? `${fmtDateTime(booking.startAt)} → ${fmtDate(booking.endAt)}` : `${fmtDateTime(trip.startAt)} → ${fmtDate(trip.endAt)}`}</T>
        {where && <T v="label">{where.name}</T>}
      </Card>
      <View style={{ flex: 1 }} />
      <Button label="Check availability again" onPress={() => {
        if (booking) trip.set({ pickupId: booking.pickupLocationId, returnId: booking.returnLocationId === booking.pickupLocationId ? null : booking.returnLocationId, startAt: new Date(booking.startAt), endAt: new Date(booking.endAt) });
        router.replace('/rides');
      }} />
      <Button label="Change dates" variant="secondary" onPress={() => { router.replace('/rides'); router.push('/dates'); }} />
    </View>
  );
}
