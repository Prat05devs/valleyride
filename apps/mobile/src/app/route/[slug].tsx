import { DIFFICULTY_LABEL, STOP_KIND_LABEL, type RouteGuideDTO, type RouteStop } from '@valleyride/shared';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteArt } from '@/components/art';
import { Glass } from '@/components/Glass';
import { Bullets, PhotoCredit } from '@/components/guide';
import { Icon } from '@/components/Icon';
import { BackButton, Button, Card, ErrorText, Loading, T } from '@/components/ui';
import { api, ApiError, mediaUrl } from '@/lib/api';
import { bikePhoto, shortName } from '@/lib/bikes';
import { useModels } from '@/lib/data';
import { inr } from '@/lib/format';
import { colors, fonts } from '@/theme';

const Kind = ({ stop }: { stop: RouteStop }) => <Text style={styles.kind}>{STOP_KIND_LABEL[stop.kind].toUpperCase()}</Text>;

function StopPhoto({ stop, aspect }: { stop: RouteStop; aspect: number }) {
  if (!stop.photo) return null;
  return (
    <View style={{ gap: 6 }}>
      <Image source={{ uri: mediaUrl(stop.photo.url) }} style={{ width: '100%', aspectRatio: aspect, borderRadius: 18, backgroundColor: colors.field }} contentFit="cover" transition={150} accessibilityLabel={stop.name} />
      <PhotoCredit photo={stop.photo} />
    </View>
  );
}

function Meta({ stop }: { stop: RouteStop }) {
  return (
    <>
      {stop.hours ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name="clock" size={15} color={colors.muted} /><T v="label">{stop.hours}</T></View> : null}
      {stop.tip ? <View style={styles.tip}><T style={{ color: colors.orangeInk, fontSize: 15, lineHeight: 21 }}><Text style={{ fontFamily: fonts.medium }}>Tip: </Text>{stop.tip}</T></View> : null}
    </>
  );
}

export default function RouteGuide() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const { byId } = useModels();
  const [r, setR] = useState<RouteGuideDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.get<RouteGuideDTO>(`/routes/${slug}`).then(setR).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load the route')); }, [slug]);

  if (error) return <View style={{ flex: 1, padding: 20, paddingTop: insets.top + 8, gap: 16 }}><BackButton /><ErrorText error={error} /></View>;
  if (!r) return <Loading />;
  const bikes = r.recommendedModels.map((id) => byId(id)).filter(Boolean);
  const way = r.stops.filter((s) => s.section === 'way');
  const explore = r.stops.filter((s) => s.section === 'explore');
  const eat = r.stops.filter((s) => s.section === 'eat');
  const chips = [`${r.distanceKm} km`, r.rideTime, r.difficulty && DIFFICULTY_LABEL[r.difficulty]].filter(Boolean) as string[];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {r.cover ? (
          <View style={styles.cover}>
            <Image source={{ uri: mediaUrl(r.cover.url) }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
            <View style={styles.coverShade} />
            <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, flex: 1, justifyContent: 'space-between', paddingBottom: 22 }}>
              <BackButton />
              <View style={{ gap: 10 }}>
                <Text style={styles.coverTitle}>{r.title}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{chips.map((c) => <View key={c} style={styles.glassChip}><Text style={styles.glassChipText}>{c}</Text></View>)}</View>
                <PhotoCredit photo={r.cover} light />
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
            <BackButton />
            <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: colors.field, marginTop: 14 }}><RouteArt kind={r.distanceKm < 25 ? 'loop' : 'climb'} height={150} /></View>
            <T v="hero" style={{ marginTop: 16 }}>{r.title}</T>
            <T v="label" style={{ marginTop: 4 }}>{chips.join(' · ')}</T>
          </View>
        )}

        <View style={{ padding: 20, gap: 14 }}>
          <Card style={{ gap: 10 }}>
            <T style={{ fontSize: 18 }}>The ride</T>
            {r.bodyMd.split(/\n{2,}/).filter((p) => !p.startsWith('- ')).map((p) => <T key={p} style={{ lineHeight: 23, color: colors.body }}>{p}</T>)}
            {r.highlights.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {r.highlights.map((h) => <View key={h} style={styles.highlight}><T style={{ fontSize: 14 }}>{h}</T></View>)}
              </View>
            )}
            {r.bestTime ? <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}><Icon name="calendar" size={17} /><T style={{ flex: 1, fontSize: 15, color: colors.body }}>Best time: {r.bestTime}</T></View> : null}
          </Card>

          {way.length > 0 && (
            <Card style={{ paddingBottom: 4 }}>
              <T style={{ fontSize: 18, marginBottom: 16 }}>Along the way</T>
              {r.mapImage ? <Image source={{ uri: mediaUrl(r.mapImage) }} style={styles.map} contentFit="cover" transition={150} accessibilityLabel={`Map of the ${r.title} route`} /> : null}
              {way.map((s, i) => (
                <View key={s.name} style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ width: 44, alignItems: 'center' }}>
                    <T v="label" style={{ fontSize: 12 }}>{s.km !== null ? `${s.km} km` : ''}</T>
                    <View style={[styles.dot, i === 0 ? { backgroundColor: colors.ink } : i === way.length - 1 ? { backgroundColor: colors.orange } : styles.dotRing]} />
                    {i < way.length - 1 && <View style={styles.rail} />}
                  </View>
                  <View style={{ flex: 1, gap: 8, paddingBottom: 22 }}>
                    <View><Kind stop={s} /><T style={{ fontSize: 18 }}>{s.name}</T></View>
                    <T style={{ lineHeight: 22, color: colors.body, fontSize: 15 }}>{s.blurb}</T>
                    <Meta stop={s} />
                    <StopPhoto stop={s} aspect={16 / 10} />
                  </View>
                </View>
              ))}
            </Card>
          )}

          {explore.length > 0 && (
            <>
              <T v="title" style={{ marginTop: 6 }}>What to see and explore</T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }} style={{ marginHorizontal: -20, paddingLeft: 20 }}>
                {explore.map((s) => (
                  <Card key={s.name} style={{ width: 280, gap: 8, padding: 14 }}>
                    <StopPhoto stop={s} aspect={4 / 3} />
                    <View><Kind stop={s} /><T v="cardTitle">{s.name}</T></View>
                    <T style={{ lineHeight: 21, color: colors.body, fontSize: 15 }}>{s.blurb}</T>
                    <Meta stop={s} />
                  </Card>
                ))}
              </ScrollView>
            </>
          )}

          {eat.length > 0 && (
            <Card style={{ gap: 14 }}>
              <T style={{ fontSize: 18 }}>Cafés and food</T>
              {eat.map((s, i) => (
                <View key={s.name} style={[{ flexDirection: 'row', gap: 12 }, i > 0 && styles.sep]}>
                  {s.photo ? <Image source={{ uri: mediaUrl(s.photo.url) }} style={styles.eatPhoto} contentFit="cover" accessibilityLabel={s.name} /> : null}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Kind stop={s} />
                    <T style={{ fontSize: 17 }}>{s.name}</T>
                    <T style={{ lineHeight: 21, color: colors.body, fontSize: 15 }}>{s.blurb}</T>
                    <Meta stop={s} />
                    {s.photo ? <PhotoCredit photo={s.photo} /> : null}
                  </View>
                </View>
              ))}
            </Card>
          )}

          <Card style={{ gap: 10, backgroundColor: colors.orangeTint }}>
            <T style={{ fontSize: 18 }}>Ride safe</T>
            <Bullets items={['Helmets are compulsory for rider and pillion.', ...r.tips]} color={colors.orangeInk} />
          </Card>
          {r.stops.some((s) => s.hours) && <T v="label" style={{ paddingHorizontal: 4 }}>Opening hours change with the season. Check locally before you set off.</T>}

          {bikes.length > 0 && <T v="title" style={{ marginTop: 6 }}>Best bikes for this route</T>}
          {r.bikeAdvice ? <T style={{ lineHeight: 22, color: colors.body }}>{r.bikeAdvice}</T> : null}
          {bikes.map((m) => (
            <Card key={m!.id} onPress={() => router.push({ pathname: '/bike/[slug]', params: { slug: m!.slug } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
              <View style={styles.thumb}><Image source={bikePhoto(m!.slug)} style={{ width: 86, height: 60 }} contentFit="contain" /></View>
              <View style={{ flex: 1 }}>
                <T style={{ fontSize: 17 }}>{shortName(m!.name)}</T>
                {m!.specs ? <T v="label">{m!.specs.highlights.slice(0, 2).map((h) => h.value).join(' · ')}</T> : null}
              </View>
              <T v="price">{inr(m!.pricePerDayPaise)}</T><T v="label">/day</T>
            </Card>
          ))}
        </View>
      </ScrollView>
      <Glass radius={0} style={[styles.bar, { paddingBottom: insets.bottom + 14 }]}>
        <Button label="Book a bike for this ride" onPress={() => router.push('/rides')} />
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 6 },
  cover: { height: 420, backgroundColor: colors.heroBg, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, overflow: 'hidden' },
  coverShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', backgroundColor: 'rgba(0,0,0,0.35)' },
  coverTitle: { fontFamily: fonts.regular, fontSize: 34, letterSpacing: -0.5, color: colors.surface },
  glassChip: { height: 32, justifyContent: 'center', borderRadius: 999, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.35)' },
  glassChipText: { fontFamily: fonts.regular, fontSize: 14, color: colors.surface },
  map: { width: '100%', aspectRatio: 16 / 10, borderRadius: 20, backgroundColor: colors.field, marginBottom: 22 },
  highlight: { borderRadius: 999, backgroundColor: colors.field, paddingHorizontal: 12, paddingVertical: 7 },
  kind: { fontFamily: fonts.regular, fontSize: 11, letterSpacing: 0.6, color: colors.muted },
  dot: { width: 13, height: 13, borderRadius: 7, marginTop: 6 },
  dotRing: { borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface },
  rail: { width: 2, flex: 1, backgroundColor: colors.line },
  tip: { backgroundColor: colors.orangeTint, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 14 },
  eatPhoto: { width: 76, height: 76, borderRadius: 16, backgroundColor: colors.field },
  thumb: { width: 96, height: 70, borderRadius: 18, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14 },
});
