import type { RouteGuideDTO, VehicleModelDTO } from '@valleyride/shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteArt } from '@/components/art';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { PhotoHeader } from '@/components/PhotoHeader';
import { Button, Card, ErrorText, IconButton, SectionHeader, T } from '@/components/ui';
import { api, mediaUrl } from '@/lib/api';
import { bikePhoto, BIKE_COPY, brandOf, shortName } from '@/lib/bikes';
import { fmtTime } from '@/lib/format';
import { inr } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useTrip } from '@/lib/trip';
import { colors, fonts } from '@/theme';

/** Short card lines, as on the website's home page; routes without an entry show their distance only. */
const ROUTE_META: Record<string, { time?: string; feel: string }> = {
  'dehradun-mussoorie': { time: '1.5 h', feel: 'winding climb' },
  'dehradun-rishikesh': { time: '1.25 h', feel: 'forest road' },
  'sahastradhara-loop': { time: '40 min', feel: 'easy ride' },
  maldevta: { feel: 'river valley' },
};
const routeLine = (r: RouteGuideDTO) => [`${r.distanceKm} km`, ROUTE_META[r.slug]?.time, ROUTE_META[r.slug]?.feel].filter(Boolean).join(' · ');

export default function Home() {
  const { user } = useSession();
  const trip = useTrip();
  const [models, setModels] = useState<VehicleModelDTO[]>([]);
  const [fleetError, setFleetError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setFleetError(null); api.get<VehicleModelDTO[]>('/vehicle-models').then(setModels).catch(() => setFleetError('Could not load the fleet. Please try again.')); }, [attempt]);
  // Routes are a teaser here; the section stays hidden if they fail to load, and the Routes screen has its own retry.
  const [routes, setRoutes] = useState<RouteGuideDTO[]>([]);
  useEffect(() => { api.get<RouteGuideDTO[]>('/routes').then(setRoutes).catch(() => {}); }, [attempt]);

  const first = (user?.fullName ?? '').split(' ')[0] || 'rider';
  const picks = models.filter((m) => m.category !== 'SCOOTER');
  const when = trip.startAt.toDateString() === new Date().toDateString() ? 'Today' : trip.startAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
      <PhotoHeader>
        <View style={styles.topRow}>
          <IconButton icon="menu" label="Menu" bg="transparent" color={colors.surface} onPress={() => router.push('/menu')} />
          <Text style={styles.brand}>Valley <Text style={{ color: colors.orange }}>Ride</Text></Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 17 }}>{first[0]?.toUpperCase()}</Text>
          </Pressable>
        </View>
        <T v="hero" style={{ color: colors.surface, marginTop: 28 }}>Hello, {first}</T>
        <T style={{ color: 'rgba(255,255,255,0.86)', marginTop: 6 }}>Where are you riding today?</T>
        <Glass tone="dark" style={styles.search} interactive>
          <Pressable accessibilityRole="button" accessibilityLabel="Find your ride" onPress={() => router.push('/search')} style={styles.searchHit}>
            <Icon name="search" size={24} color={colors.surface} strokeWidth={1.7} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 17, color: colors.surface }}>Find your ride</Text>
              <Text numberOfLines={1} style={{ fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.84)' }}>{trip.pickup?.name ?? 'Choose a pickup point'}  •  {when}, {fmtTime(trip.startAt)}</Text>
            </View>
          </Pressable>
          <IconButton icon="sliders" label="Filters" size={52} onPress={() => router.push('/search')} />
        </Glass>
      </PhotoHeader>

      <View style={{ paddingTop: 26, gap: 16 }}>
        {fleetError && <View style={{ paddingHorizontal: 20, gap: 10 }}><ErrorText error={fleetError} /><Button label="Try again" onPress={() => setAttempt((n) => n + 1)} /></View>}
        <SectionHeader title="Top picks" sub="Ride the hills this week" action="View all" onAction={() => router.push('/rides')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}>
          {picks.map((m) => (
            <Card key={m.id} style={{ width: 300, gap: 12 }} onPress={() => router.push({ pathname: '/bike/[slug]', params: { slug: m.slug } })}>
              <Image source={bikePhoto(m.slug)} style={{ width: '100%', height: 160 }} contentFit="contain" accessibilityLabel={m.name} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View><T v="cardTitle">{shortName(m.name)}</T><T v="label" style={{ marginTop: 2 }}>{brandOf(m.name)} · {BIKE_COPY[m.slug]?.tag}</T></View>
                <View style={{ alignItems: 'flex-end' }}><T v="price">{inr(m.pricePerDayPaise)}</T><T v="label">/day</T></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={styles.meta}><Icon name="pin" size={16} color={colors.muted} /><T v="label">{trip.pickup?.name ?? 'Dehradun'}</T></View>
                <View style={styles.meta}><Icon name="gauge" size={16} color={colors.muted} /><T v="label">{m.kmPerDay} km/day</T></View>
              </View>
            </Card>
          ))}
        </ScrollView>
      </View>

      {routes.length > 0 && (
        <View style={{ paddingTop: 26, gap: 16 }}>
          <SectionHeader title="Popular routes" sub="Weekend rides from Dehradun" action="View all" onAction={() => router.push('/routes')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}>
            {routes.map((r) => (
              <Card key={r.id} style={{ width: 240, padding: 14, gap: 6 }} onPress={() => router.push({ pathname: '/route/[slug]', params: { slug: r.slug } })}>
                {r.mapImage
                  ? <Image source={{ uri: mediaUrl(r.mapImage) }} style={styles.routeMap} contentFit="cover" transition={150} accessibilityLabel={`Map of the ${r.title} route`} />
                  : <RouteArt kind={r.distanceKm < 25 ? 'loop' : 'climb'} height={92} />}
                <T style={{ fontSize: 17 }} numberOfLines={1}>{r.title}</T>
                <T v="label" numberOfLines={1}>{routeLine(r)}</T>
              </Card>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ paddingTop: 26, gap: 16 }}>
        <SectionHeader title="Our fleet" sub="30 bikes across four models" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}>
          {models.map((m) => (
            <Card key={m.id} style={{ width: 168, padding: 14, gap: 6 }} onPress={() => router.push({ pathname: '/bike/[slug]', params: { slug: m.slug } })}>
              <Image source={bikePhoto(m.slug)} style={{ width: '100%', height: 104 }} contentFit="contain" accessibilityLabel={m.name} />
              <T>{shortName(m.name)}</T>
              <Text style={{ fontFamily: fonts.medium, fontSize: 15 }}>{inr(m.pricePerDayPaise)}<Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.muted }}>/day</Text></Text>
            </Card>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: fonts.medium, fontSize: 26, letterSpacing: -0.3, color: colors.surface },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  search: { marginTop: 26, height: 68, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 22, paddingRight: 8 },
  searchHit: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, height: '100%' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  routeMap: { width: '100%', height: 120, borderRadius: 18, backgroundColor: colors.field },
});
