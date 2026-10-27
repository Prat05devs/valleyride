import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Button, Card, IconButton, InfoRow, LoadError, Loading, T } from '@/components/ui';
import { useBooking, useModels } from '@/lib/data';
import { fmtDateTime } from '@/lib/format';
import { addToCalendar, openDirections } from '@/lib/links';
import { useTrip } from '@/lib/trip';
import { colors } from '@/theme';

export default function Confirmed() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { booking, error, reload } = useBooking(id);
  const { byId } = useModels();
  const { locations } = useTrip();
  if (!booking) return error ? <LoadError error={error} onRetry={reload} /> : <Loading />;
  const pickup = locations.find((l) => l.id === booking.pickupLocationId);
  const model = byId(booking.vehicleModelId);
  const close = () => router.replace('/(tabs)/trips');

  return (
    <ScrollView style={{ backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, gap: 16, alignItems: 'center' }}>
      <View style={{ alignSelf: 'flex-end' }}><IconButton icon="x" label="Close" onPress={close} /></View>
      <View style={styles.ring}><View style={styles.check}><Icon name="check" size={38} color={colors.surface} strokeWidth={2} /></View></View>
      <View style={{ gap: 6, alignItems: 'center' }}>
        <T v="hero">You're booked</T>
        <T style={{ color: colors.muted, textAlign: 'center' }}>Your booking is confirmed. Details and receipt are available in Trips.</T>
      </View>
      <View style={{ gap: 6, alignItems: 'center' }}>
        <T v="label">Booking code</T>
        <View style={styles.code}><T style={{ fontSize: 24, letterSpacing: 3, fontFamily: 'Urbanist_500Medium' }}>{booking.code}</T></View>
      </View>
      <Card style={{ alignSelf: 'stretch', gap: 14, paddingVertical: 16 }}>
        <InfoRow icon="calendar" label="Pickup" value={fmtDateTime(booking.startAt)} />
        {pickup && <InfoRow icon="pin" label={pickup.name} value={pickup.address} />}
        <InfoRow icon="idcard" label="Bring with you" value="Original driving licence and ID" />
      </Card>
      <T v="label" style={{ lineHeight: 20, textAlign: 'center' }}>At pickup we check your documents and take pre-ride photos, and you sign the rental agreement.</T>
      <Button label="View trip" style={{ alignSelf: 'stretch' }} onPress={() => router.replace({ pathname: '/trip/[id]', params: { id: booking.id } })} />
      <View style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 10 }}>
        <Button label="Add to calendar" variant="secondary" size="md" style={{ flex: 1 }}
          onPress={() => addToCalendar({ title: `Valley Ride pickup · ${model?.name ?? 'your bike'}`, start: booking.startAt, end: booking.endAt, location: pickup ? `${pickup.name}, ${pickup.address}` : 'Valley Ride', details: `Booking ${booking.code}. Bring your original driving licence and ID.` })} />
        <Button label="Google Maps" variant="secondary" size="md" style={{ flex: 1 }} disabled={!pickup} onPress={() => pickup && openDirections(pickup)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ring: { width: 104, height: 104, borderRadius: 52, borderWidth: 2, borderColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  check: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  code: { height: 56, paddingHorizontal: 26, borderRadius: 999, backgroundColor: colors.surface, justifyContent: 'center' },
});
