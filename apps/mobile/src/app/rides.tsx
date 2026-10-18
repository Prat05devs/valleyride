import type { AvailabilityDTO, Quote, VehicleModelDTO } from '@valleyride/shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { BackButton, Card, Chip, ErrorText, Loading, T, Tag } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { bikePhoto, BIKE_COPY, brandOf, shortName } from '@/lib/bikes';
import { fmtDate, fmtTime, inr } from '@/lib/format';
import { useTrip } from '@/lib/trip';
import { colors, fonts } from '@/theme';

const CATS = [{ id: 'all', label: 'All' }, { id: 'SCOOTER', label: 'Scooters' }, { id: 'MOTORCYCLE', label: 'Motorcycles' }, { id: 'ADVENTURE', label: 'Adventure' }];

export default function Rides() {
  const t = useTrip();
  const [models, setModels] = useState<VehicleModelDTO[] | null>(null);
  const [free, setFree] = useState<Record<string, number>>({});
  const [quotes, setQuotes] = useState<Record<string, Quote | undefined>>({});
  const [cat, setCat] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const q = `startAt=${encodeURIComponent(t.startAt.toISOString())}&endAt=${encodeURIComponent(t.endAt.toISOString())}${t.pickupId ? `&pickup=${t.pickupId}` : ''}${t.oneWay && t.returnId ? `&return=${t.returnId}` : ''}`;
    Promise.all([api.get<VehicleModelDTO[]>('/vehicle-models'), api.get<AvailabilityDTO[]>(`/availability?${q}`)])
      .then(([ms, av]) => { setModels(ms); setFree(Object.fromEntries(av.map((a) => [a.model_id, a.free]))); setQuotes(Object.fromEntries(av.map((a) => [a.model_id, a.quote]))); })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load rides'));
  }, [t.startAt, t.endAt, t.pickupId, t.returnId, t.oneWay]);

  const list = (models ?? []).filter((m) => cat === 'all' || m.category === cat);
  const available = list.filter((m) => (free[m.id] ?? 0) > 0);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><BackButton /><T v="title">Available rides</T></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Change search" onPress={() => router.push('/search')} style={styles.summary}>
          <Icon name="pin" />
          <View style={{ flex: 1 }}>
            <T>{t.pickup?.name ?? 'Pickup point'}</T>
            <T v="label" numberOfLines={1}>{fmtDate(t.startAt)}, {fmtTime(t.startAt)} → {fmtDate(t.endAt)}</T>
          </View>
          <View style={styles.edit}><Icon name="sliders" size={20} color={colors.surface} /></View>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATS.map((c) => <Chip key={c.id} label={c.label} selected={cat === c.id} onPress={() => setCat(c.id)} />)}
        </ScrollView>
        <ErrorText error={error} />
        {!models && !error ? <Loading /> : (
          <>
            <T v="label">{available.length} {available.length === 1 ? 'model' : 'models'} free for your {t.days}-day trip</T>
            {list.map((m) => {
              const n = free[m.id] ?? 0;
              const q = quotes[m.id]; // priced by the API (pricing_rules included), never on the phone
              return (
                <Card key={m.id} style={{ gap: 6, opacity: n ? 1 : 0.55 }} onPress={n ? () => router.push({ pathname: '/bike/[slug]', params: { slug: m.slug } }) : undefined}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag label={BIKE_COPY[m.slug]?.tag ?? m.category} />
                    <T v="label" style={{ color: colors.orangeInk }}>{n === 0 ? 'Fully booked' : n <= 2 ? `Only ${n} left` : `${n} free`}</T>
                  </View>
                  <Image source={bikePhoto(m.slug)} style={{ width: '100%', height: 160 }} contentFit="contain" accessibilityLabel={m.name} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
                    <View style={{ flexShrink: 1 }}>
                      <T v="label">{brandOf(m.name)}</T>
                      <T v="cardTitle" style={{ marginTop: 2 }}>{shortName(m.name)}</T>
                      <T v="label" style={{ marginTop: 4 }}>{q ? `${q.kmIncluded} km · ` : ''}{inr(m.depositPaise)} deposit</T>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: fonts.medium, fontSize: 22 }}>{inr(m.pricePerDayPaise)}<Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.muted }}>/day</Text></Text>
                      {q && <T v="label" style={{ marginTop: 4 }}>{inr(q.totalPaise, { decimals: 'never' })} for {q.days} {q.days === 1 ? 'day' : 'days'}</T>}
                    </View>
                  </View>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 64, paddingLeft: 20, paddingRight: 8, borderRadius: 999, backgroundColor: colors.surface },
  edit: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
