import type { BookingDTO, BookingStatus } from '@valleyride/shared';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Button, Card, ErrorText, Notice, T, Tag } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { bikePhoto, shortName } from '@/lib/bikes';
import { pickupIn, STATUS_LABEL, useModels } from '@/lib/data';
import { fmtDate, fmtDateTime, inr } from '@/lib/format';
import { useTrip } from '@/lib/trip';
import { colors } from '@/theme';

const UPCOMING: BookingStatus[] = ['PENDING_PAYMENT', 'CONFIRMED', 'ONGOING'];

export default function Trips() {
  const insets = useSafeAreaInsets();
  const { byId } = useModels();
  const { locations } = useTrip();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [list, setList] = useState<BookingDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setList(await api.get<BookingDTO[]>('/bookings')); setError(null); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not load your trips'); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const upcoming = (list ?? []).filter((b) => UPCOMING.includes(b.status)).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const past = (list ?? []).filter((b) => !UPCOMING.includes(b.status));
  const shown = tab === 'upcoming' ? upcoming : past;
  const open = (b: BookingDTO) => router.push({ pathname: '/trip/[id]', params: { id: b.id } });

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 150, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
    >
      <View><T v="hero">Trips</T><T v="label" style={{ marginTop: 2 }}>Your bookings and deposits</T></View>
      <View style={styles.segment} accessibilityRole="tablist">
        {(['upcoming', 'past'] as const).map((k) => (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} onPress={() => setTab(k)}
            style={[styles.seg, tab === k && { backgroundColor: colors.ink }]}>
            <T style={{ color: tab === k ? colors.surface : colors.ink }}>{k === 'upcoming' ? 'Upcoming' : 'Past'}</T>
          </Pressable>
        ))}
      </View>
      <ErrorText error={error} />

      {list && shown.length === 0 && (
        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
          <Icon name="route" size={32} />
          <T style={{ fontSize: 18 }}>{tab === 'upcoming' ? 'No upcoming trips' : 'No past trips yet'}</T>
          {tab === 'upcoming' && <Button label="Find a ride" size="md" onPress={() => router.push('/rides')} style={{ alignSelf: 'stretch', marginTop: 6 }} />}
        </Card>
      )}

      {tab === 'upcoming' && shown.map((b) => {
        const m = byId(b.vehicleModelId);
        const loc = locations.find((l) => l.id === b.pickupLocationId);
        return (
          <Card key={b.id} onPress={() => open(b)} style={{ gap: 8, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag label={STATUS_LABEL[b.status]} tone={b.status === 'PENDING_PAYMENT' ? 'orange' : 'ink'} />
              <T v="label" style={{ color: colors.orangeInk }}>{b.status === 'ONGOING' ? `Return ${fmtDateTime(b.endAt)}` : pickupIn(b.startAt)}</T>
            </View>
            {m && <Image source={bikePhoto(m.slug)} style={{ width: '100%', height: 150 }} contentFit="contain" accessibilityLabel={m.name} />}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <T v="cardTitle">{m ? shortName(m.name) : 'Your bike'}</T>
              <T v="label" style={{ letterSpacing: 1 }}>{b.code}</T>
            </View>
            <View style={styles.meta}><Icon name="calendar" size={16} color={colors.muted} /><T v="label">{fmtDateTime(b.startAt)} → {fmtDateTime(b.endAt)}</T></View>
            {loc && <View style={styles.meta}><Icon name="pin" size={16} color={colors.muted} /><T v="label">{loc.name}</T></View>}
            <Button label={b.status === 'PENDING_PAYMENT' ? 'Finish paying' : 'View trip'} size="md" onPress={() => open(b)} style={{ marginTop: 6 }} />
          </Card>
        );
      })}
      {tab === 'upcoming' && upcoming.some((b) => b.status === 'CONFIRMED') && (
        <Notice icon="idcard" text="Bring your original driving licence and an ID proof to pickup." />
      )}

      {tab === 'past' && shown.map((b) => {
        const m = byId(b.vehicleModelId);
        return (
          <Card key={b.id} onPress={() => open(b)} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 14 }}>
            <View style={styles.thumb}>{m && <Image source={bikePhoto(m.slug)} style={{ width: 74, height: 68 }} contentFit="contain" />}</View>
            <View style={{ flex: 1, gap: 3 }}>
              <T style={{ fontSize: 17 }}>{m ? shortName(m.name) : b.code}</T>
              <T v="label">{fmtDate(b.startAt)} → {fmtDate(b.endAt)} · {b.code}</T>
              <View style={styles.pastTag}><T style={{ fontSize: 14 }}>{pastNote(b)}</T></View>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function pastNote(b: BookingDTO) {
  if (b.status === 'DEPOSIT_SETTLED') return `Deposit refunded · ${inr(b.depositPaise)}`;
  if (b.status === 'COMPLETED') return 'Deposit being checked';
  return STATUS_LABEL[b.status];
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: colors.surface },
  seg: { flex: 1, height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thumb: { width: 96, height: 78, borderRadius: 18, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  pastTag: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.field },
});
