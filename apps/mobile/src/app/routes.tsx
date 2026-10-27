import type { RouteGuideDTO } from '@valleyride/shared';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteArt } from '@/components/art';
import { BackButton, Button, Card, ErrorText, Loading, Row, T, Tag } from '@/components/ui';
import { Image } from 'expo-image';
import { api, mediaUrl } from '@/lib/api';
import { shortName } from '@/lib/bikes';
import { useModels } from '@/lib/data';
import { colors } from '@/theme';

/** Under 25 km is an easy loop near the city; the rest are hill rides. */
const isLoop = (r: RouteGuideDTO) => r.distanceKm < 25;

export default function Routes() {
  const insets = useSafeAreaInsets();
  const { byId } = useModels();
  const [routes, setRoutes] = useState<RouteGuideDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setError(null); api.get<RouteGuideDTO[]>('/routes').then(setRoutes).catch(() => setError('Could not load route guides. Please try again.')); }, [attempt]);
  const open = (r: RouteGuideDTO) => router.push({ pathname: '/route/[slug]', params: { slug: r.slug } });

  const card = (r: RouteGuideDTO) => (
    <Card key={r.id} onPress={() => open(r)} style={{ gap: 10, padding: 14 }}>
      <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: colors.field }}>
        {r.cover
          ? <Image source={{ uri: mediaUrl(r.cover.url) }} style={{ width: '100%', height: 150 }} contentFit="cover" accessibilityLabel="" />
          : <RouteArt kind={isLoop(r) ? 'loop' : 'climb'} height={110} />}
      </View>
      <View style={{ paddingHorizontal: 4, gap: 4 }}>
        <T v="label">{[`${r.distanceKm} km`, r.rideTime].filter(Boolean).join(' · ')}</T>
        <T v="cardTitle">{r.title}</T>
        <T v="label" numberOfLines={3}>{r.bodyMd.split('\n')[0]}</T>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          {r.recommendedModels.map((id) => byId(id)).filter(Boolean).map((m) => <Tag key={m!.id} label={shortName(m!.name)} />)}
        </View>
      </View>
    </Card>
  );

  return (
    <ScrollView style={{ backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30, gap: 14 }}>
      <Row><BackButton /><T v="title">Routes</T></Row>
      <View><T v="hero">Ride the hills from Dehradun</T><T style={{ color: colors.muted, marginTop: 4 }}>{routes ? `${routes.length} routes` : 'Routes'}, with the right bike for each.</T></View>
      {error && <><ErrorText error={error} /><Button label="Try again" onPress={() => setAttempt((n) => n + 1)} /></>}
      {!routes ? (!error && <Loading />) : routes.length === 0 ? <Card><T v="label">Route guides are on their way.</T></Card> : (
        <>
          <View><T v="title">Weekend climbs</T><T v="label">Hill rides from the city</T></View>
          {routes.filter((r) => !isLoop(r)).map(card)}
          <View style={{ marginTop: 8 }}><T v="title">Easy loops</T><T v="label">Short rides near the city</T></View>
          {routes.filter(isLoop).map(card)}
        </>
      )}
      <Button label="Find a bike" variant="secondary" onPress={() => router.push('/rides')} />
    </ScrollView>
  );
}
