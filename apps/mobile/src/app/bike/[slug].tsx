import type { AvailabilityDTO, Quote, RouteGuideDTO, VehicleModelDTO } from '@valleyride/shared';
import { useTiers } from '@/lib/copy';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass } from '@/components/Glass';
import { ModelSpecs } from '@/components/guide';
import { Icon, type IconName } from '@/components/Icon';
import { BackButton, Button, Card, Chip, ErrorText, Line, LoadError, Loading, Row, T, Tag } from '@/components/ui';
import { api } from '@/lib/api';
import { bikePhoto, BIKE_COPY, brandOf, shortName } from '@/lib/bikes';
import { fmtDate, fmtTime, inr } from '@/lib/format';
import { useTrip } from '@/lib/trip';
import { offerWindow } from '@/lib/date-selection';
import { colors, fonts } from '@/theme';

export default function Bike() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const t = useTrip();
  const [m, setM] = useState<VehicleModelDTO | null>(null);
  const [free, setFree] = useState<number | null>(null);
  const [q, setQ] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pricing, setPricing] = useState(true);
  const fallbackTiers = useTiers();
  const tiers = q?.durationTiers ?? fallbackTiers;
  const [routes, setRoutes] = useState<RouteGuideDTO[]>([]);
  useEffect(() => { api.get<RouteGuideDTO[]>('/routes').then(setRoutes).catch(() => {}); }, []);

  useEffect(() => {
    // Quotes require a pickup location. Ignore results from an earlier search or route.
    if (!t.pickupId) return;
    let active = true;
    setError(null);
    setPricing(true);
    setFree(null);
    api.get<VehicleModelDTO>(`/vehicle-models/${slug}`).then((model) => {
      if (!active) return;
      setM(model);
      const qs = `startAt=${encodeURIComponent(t.startAt.toISOString())}&endAt=${encodeURIComponent(t.endAt.toISOString())}${t.pickupId ? `&pickup=${t.pickupId}` : ''}${t.oneWay && t.returnId ? `&return=${t.returnId}` : ''}`;
      return api.get<AvailabilityDTO[]>(`/availability?${qs}`).then((av) => {
        if (!active) return;
        const row = av.find((a) => a.model_id === model.id);
        if (!row?.quote) throw new Error('Could not price these dates. Try another date range.');
        setFree(row.free); setQ(row.quote); // the API prices it, pricing_rules included
      });
    }).catch((e) => { if (active) setError(e instanceof Error ? e.message : 'Could not load this bike'); })
      .finally(() => { if (active) setPricing(false); });
    return () => { active = false; };
  }, [slug, t.startAt, t.endAt, t.pickupId, t.returnId, t.oneWay, attempt]);

  if (t.locationError && !t.pickupId) return <LoadError error={t.locationError} onRetry={t.reloadLocations} />;
  if (error) return <View style={{ flex: 1, padding: 20, paddingTop: insets.top + 8, gap: 16 }}><BackButton /><ErrorText error={error} /><Button label="Try again" onPress={() => setAttempt((n) => n + 1)} /><Button label="Change dates" variant="secondary" onPress={() => router.push({ pathname: '/search', params: { mode: 'edit', ...(m ? { modelId: m.id, slug: m.slug } : {}) } })} /></View>;
  if (!m || !q) return <Loading />;
  const extraKm = inr(m.extraKmPaise);
  const tiles: [IconName, string, string][] = [['gauge', `${m.kmPerDay} km`, 'per day included'], ['route', `${extraKm}/km`, 'after that'], ['shield', inr(m.depositPaise), 'refundable deposit']];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
        <View style={[styles.stage, { paddingTop: insets.top + 8 }]}>
          <Row style={{ justifyContent: 'space-between' }}>
            <BackButton bg={colors.field} />
            {free !== null && <Tag tone="orange" label={free ? `${free} free on your dates` : 'Fully booked on your dates'} />}
          </Row>
          <Image source={bikePhoto(m.slug)} style={{ width: '100%', height: 230, marginTop: 10 }} contentFit="contain" accessibilityLabel={m.name} />
        </View>
        <View style={{ padding: 20, gap: 16 }}>
          <View>
            <T v="label">{brandOf(m.name)} · {BIKE_COPY[m.slug]?.tag} · {m.engineCc} cc{m.specs ? ` · ${m.specs.modelYear}` : ''}</T>
            <T v="hero" style={{ marginTop: 4 }}>{shortName(m.name)}</T>
            <T style={{ marginTop: 8, color: colors.body, lineHeight: 23 }}>{BIKE_COPY[m.slug]?.use}</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {tiles.map(([icon, v, l]) => (
              <View key={l} style={styles.tile}>
                <View style={styles.tileIcon}><Icon name={icon} size={18} /></View>
                <Text style={{ fontFamily: fonts.medium, fontSize: 17 }}>{v}</Text><T v="label">{l}</T>
              </View>
            ))}
          </View>
          <Card style={{ gap: 12 }}>
            <T style={{ fontSize: 18 }}>Longer rides cost less</T>
            <T v="label">Choose an offer to update your return date. The discount is included in the price.</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[...tiers].reverse().map((tier) => <Chip key={tier.minDays} tone="field" selected={!pricing && q.tierPct === tier.pct} label={`${tier.minDays}+ days · ${tier.pct}% off`} onPress={() => t.set(offerWindow(t.startAt, tier.minDays))} />)}
            </View>
          </Card>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} onPress={() => router.push({ pathname: '/search', params: { mode: 'edit', modelId: m.id, slug: m.slug } })}>
            <View style={styles.tileIcon}><Icon name="calendar" size={20} /></View>
            <View style={{ flex: 1 }}>
              <T>{fmtDate(t.startAt)}, {fmtTime(t.startAt)} → {fmtDate(t.endAt)}, {fmtTime(t.endAt)}</T>
              <T v="label">{t.oneWay ? `${t.pickup?.name} → ${t.returnPoint?.name}` : `Pickup and return at ${t.pickup?.name}`}</T>
            </View>
            <T style={{ textDecorationLine: 'underline', fontSize: 15 }}>Change</T>
          </Card>
          <Card style={{ gap: 10 }}>
            <T style={{ fontSize: 18 }}>What you pay</T>
            <Line label={`Rental · ${q.days} ${q.days === 1 ? 'day' : 'days'} · incl. GST`} value={inr(q.totalPaise, { decimals: 'always' })} />
            <Line label="Refundable deposit" value={inr(q.depositPaise, { decimals: 'always' })} />
            <Line label="Total due now" value={inr(q.payNowPaise, { decimals: 'always' })} strong />
            <T v="label">18% GST is already included. The deposit is returned after the return inspection.</T>
          </Card>
          {m.specs && <ModelSpecs name={shortName(m.name)} specs={m.specs} routes={routes.filter((r) => r.recommendedModels.includes(m.id))} />}
        </View>
      </ScrollView>
      <Glass radius={0} style={[styles.bar, { paddingBottom: insets.bottom + 14 }]}>
        <View style={{ flex: 1 }}><T v="label">Total due now</T><Text style={{ fontFamily: fonts.medium, fontSize: 24 }}>{pricing ? 'Updating…' : inr(q.payNowPaise, { decimals: 'always' })}</Text><T v="label">{pricing ? 'Checking your dates' : `${q.days} ${q.days === 1 ? 'day' : 'days'} · includes ${inr(q.depositPaise)} deposit`}</T></View>
        <Button label="Book now" style={{ width: 166 }} disabled={pricing} onPress={() => router.push({ pathname: '/search', params: { mode: 'book', modelId: m.id, slug: m.slug } })} />
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { backgroundColor: colors.surface, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, paddingHorizontal: 20, paddingBottom: 22 },
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: 22, padding: 12, paddingVertical: 14, gap: 6 },
  tileIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 14 },
});
