import { deskOpenAt, type AvailabilityDTO } from '@valleyride/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Button, Divider, ErrorText, IconButton, Notice, T } from '@/components/ui';
import { fmtDate, fmtTime } from '@/lib/format';
import { tierNote, useTiers } from '@/lib/copy';
import { useTrip } from '@/lib/trip';
import { colors, fonts } from '@/theme';
import { api } from '@/lib/api';

function FieldButton({ icon, label, detail, onPress }: { icon: 'pin' | 'calendar' | 'clock'; label: string; detail?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.field, { opacity: pressed ? 0.8 : 1 }]}>
      <Icon name={icon} />
      <Text style={styles.fieldText}>{label}</Text>
      {detail && <Text style={styles.fieldDetail} numberOfLines={1}>{detail}</Text>}
    </Pressable>
  );
}

export default function Search() {
  const { mode, modelId, slug } = useLocalSearchParams<{ mode?: string; modelId?: string; slug?: string }>();
  const selectedBike = !!modelId && !!slug;
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tiers = useTiers();
  const t = useTrip();
  const windowError = t.startAt <= new Date() ? 'Choose a future pickup time.' : t.endAt.getTime() - t.startAt.getTime() < 4 * 3_600_000 ? 'Rentals are at least 4 hours.' : !deskOpenAt(t.pickup?.openHours, t.startAt) || !deskOpenAt(t.returnPoint?.openHours, t.endAt) ? 'Choose times within the selected desks’ opening hours (IST).' : null;
  async function continueBooking() {
    if (windowError) return;
    if (selectedBike && mode === 'edit') { router.back(); return; }
    if (!selectedBike) { router.replace('/rides'); return; }
    setChecking(true); setError(null);
    try {
      const qs = new URLSearchParams({ startAt: t.startAt.toISOString(), endAt: t.endAt.toISOString(), pickup: t.pickupId!, ...(t.oneWay && t.returnId ? { return: t.returnId } : {}) });
      const rows = await api.get<AvailabilityDTO[]>(`/availability?${qs}`);
      if (!(rows.find((r) => r.model_id === modelId)?.free)) {
        setError('Your selected bike is not available at this hub on these dates. Change the dates or choose another bike.');
        return;
      }
      router.replace({ pathname: '/checkout', params: { modelId, slug } });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not check your selected bike. Please try again.'); }
    finally { setChecking(false); }
  }
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.head}>
        <View style={{ position: 'absolute', left: 20 }}><IconButton icon="x" label="Close" bg="transparent" onPress={() => router.back()} /></View>
        <T v="title">Pickup &amp; Return</T>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        {t.locationError && <><ErrorText error={t.locationError} /><Button label="Try again" onPress={t.reloadLocations} /></>}
        <T style={{ color: colors.muted }}>Pickup point</T>
        <FieldButton icon="pin" label={t.pickup?.name ?? 'Choose a pickup point'} detail={t.pickup?.address.split(',')[0]} onPress={() => router.push({ pathname: '/pickup-point', params: { which: 'pickup' } })} />
        {t.oneWay ? (
          <View style={{ gap: 8 }}>
            <T style={{ color: colors.muted }}>Return point</T>
            <FieldButton icon="pin" label={t.returnPoint?.name ?? 'Choose'} onPress={() => router.push({ pathname: '/pickup-point', params: { which: 'return' } })} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T v="label" style={{ color: colors.orangeInk }}>One-way fee ₹400 added</T>
              <Pressable accessibilityRole="button" onPress={() => t.set({ returnId: null })} hitSlop={10}><T style={{ textDecorationLine: 'underline', fontSize: 15 }}>Same as pickup</T></Pressable>
            </View>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/pickup-point', params: { which: 'return' } })} style={styles.oneWay}>
            <Icon name="plus" /><T>Return at another location</T><T v="label">+ ₹400</T>
          </Pressable>
        )}
        <Divider bleed={20} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {(['start', 'end'] as const).map((k) => {
            const d = k === 'start' ? t.startAt : t.endAt;
            return (
              <View key={k} style={{ flex: 1, gap: 8 }}>
                <T style={{ color: colors.muted }}>{k === 'start' ? 'Pickup' : 'Return'}</T>
                <View style={styles.pair}>
                  <FieldButton icon="calendar" label={fmtDate(d)} onPress={() => router.push({ pathname: '/dates', params: { picking: k } })} />
                  <FieldButton icon="clock" label={fmtTime(d)} onPress={() => router.push({ pathname: '/dates', params: { picking: k, focus: 'time' } })} />
                </View>
              </View>
            );
          })}
        </View>
        <Notice text={tierNote(t.days, tiers)} />
        <T v="label">Rates include 18% GST. Rentals use started 24-hour blocks, with a four-hour minimum.</T>
        <ErrorText error={windowError ?? error} />
        {selectedBike && error && <Button label="See other bikes" variant="secondary" onPress={() => router.replace('/rides')} />}
      </ScrollView>
      <View style={{ padding: 20, paddingTop: 10 }}>
        <Button label={selectedBike ? mode === 'edit' ? 'Save changes' : 'Continue to review' : 'Find rides'} loading={checking} disabled={!t.pickupId || !!t.locationError || !!windowError} onPress={continueBooking} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { height: 72, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 28, backgroundColor: colors.field },
  fieldText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink },
  fieldDetail: { marginLeft: 'auto', fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  pair: { gap: 10, padding: 10, borderRadius: 26, borderWidth: 1, borderColor: colors.line },
  oneWay: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 48 },
});
