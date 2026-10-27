import { MIN_HOURS, IST_OFFSET_MS, istWallClock, deskOpenAt } from '@valleyride/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, ErrorText, IconButton, T } from '@/components/ui';
import { useTrip } from '@/lib/trip';
import { colors, fonts } from '@/theme';
import { tierNote, useTiers } from '@/lib/copy';
import { selectDay, type DateSelection } from '@/lib/date-selection';

const TIMES = [8, 9, 10, 11, 12, 14, 16, 18, 20];
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayKey = (d: Date) => Date.UTC(istWallClock(d).getUTCFullYear(), istWallClock(d).getUTCMonth(), istWallClock(d).getUTCDate());
const label = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;

export default function Dates() {
  const { picking: initialPicking, focus } = useLocalSearchParams<{ picking?: string; focus?: string }>();
  const scroll = useRef<ScrollView>(null);
  const [timesY, setTimesY] = useState(0);
  const tiers = useTiers();
  const t = useTrip();
  const [{ start, end, picking }, setSelection] = useState<DateSelection>({ start: dayKey(t.startAt), end: dayKey(t.endAt), picking: initialPicking === 'end' ? 'end' : 'start' });
  const [startH, setStartH] = useState(istWallClock(t.startAt).getUTCHours());
  const [endH, setEndH] = useState(istWallClock(t.endAt).getUTCHours());
  const today = dayKey(new Date());

  const months = useMemo(() => {
    const now = istWallClock(new Date());
    return Array.from({ length: 6 }, (_, o) => {
      const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + o, 1));
      const daysIn = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
      const offset = (first.getUTCDay() + 6) % 7;
      const cells: (number | null)[] = Array(offset).fill(null);
      for (let d = 1; d <= daysIn; d++) cells.push(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), d));
      return { title: first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }), cells };
    });
  }, []);

  function tap(k: number) {
    setSelection((state) => selectDay(state, k));
  }

  const startAt = new Date(start - IST_OFFSET_MS + startH * 3_600_000);
  const endAt = end === null ? null : new Date(end - IST_OFFSET_MS + endH * 3_600_000);
  const hours = endAt ? (endAt.getTime() - startAt.getTime()) / 3_600_000 : 0;
  const days = Math.max(1, Math.ceil(hours / 24 - 1e-9));
  const tooShort = !!endAt && hours < MIN_HOURS;
  const past = startAt.getTime() < Date.now();
  const closed = !deskOpenAt(t.pickup?.openHours, startAt) || (!!endAt && !deskOpenAt(t.returnPoint?.openHours, endAt));

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.head}>
        <View style={{ position: 'absolute', left: 20 }}><IconButton icon="back" label="Back" bg="transparent" onPress={() => router.back()} /></View>
        <T v="title">Dates</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, padding: 20, paddingBottom: 6 }}>
        {(['start', 'end'] as const).map((k) => (
          <Pressable key={k} accessibilityRole="button" accessibilityLabel={`Choose ${k === 'start' ? 'pickup' : 'return'} day`} accessibilityState={{ selected: picking === k }} {...(Platform.OS === 'web' ? { 'aria-pressed': picking === k } : {})} onPress={() => setSelection((s) => ({ ...s, picking: k }))} style={[styles.sumBox, { backgroundColor: picking === k ? colors.orangeTint : colors.field }]}>
            <T v="label">{k === 'start' ? 'Pickup' : 'Return'}</T>
            <T style={{ fontSize: 16 }}>{k === 'start' ? startAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }) + ' · ' + label(startH) : endAt ? endAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }) + ' · ' + label(endH) : 'Choose a day'}</T>
          </Pressable>
        ))}
      </View>
      <ScrollView ref={scroll} onContentSizeChange={() => { if (focus === 'time' && timesY) scroll.current?.scrollTo({ y: timesY, animated: false }); }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 18 }}>
        {months.map((m) => (
          <View key={m.title} style={{ gap: 8 }}>
            <T style={{ fontSize: 18 }}>{m.title}</T>
            <View style={styles.grid}>
              {WD.map((w) => <Text key={w} style={styles.wd}>{w}</Text>)}
              {m.cells.map((k, i) => {
                if (k === null) return <View key={'b' + i} style={styles.cell} />;
                const d = new Date(k).getUTCDate();
                const disabled = k < today;
                const edge = k === start || k === end;
                const mid = end !== null && k > start && k < end;
                return (
                  <Pressable key={k} disabled={disabled} onPress={() => tap(k)} accessibilityRole="button" accessibilityState={{ selected: edge, disabled }}
                    accessibilityLabel={new Date(k).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })} style={[styles.cell, mid && { backgroundColor: colors.field }]}>
                    <View style={[styles.day, edge && { backgroundColor: colors.ink }]}>
                      <Text style={{ fontFamily: edge ? fonts.medium : fonts.regular, fontSize: 16, color: disabled ? colors.disabled : edge ? colors.surface : colors.ink }}>{d}</Text>
                      {k === today && !edge && <View style={styles.todayDot} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        {(['start', 'end'] as const).map((k) => (
          <View key={k} onLayout={k === 'start' ? (e) => { const y = e.nativeEvent.layout.y; setTimesY(y); if (focus === 'time') scroll.current?.scrollTo({ y, animated: false }); } : undefined} style={{ gap: 8 }}>
            <T v="label">{k === 'start' ? 'Pickup' : 'Return'} time · desks open 8 AM – 8 PM</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {TIMES.map((h) => <Chip key={h} tone="field" label={label(h)} selected={(k === 'start' ? startH : endH) === h} onPress={() => (k === 'start' ? setStartH(h) : setEndH(h))} />)}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
      <View style={styles.foot}>
        <View style={{ flex: 1 }}>
          <T style={{ fontSize: 17 }}>{endAt ? `${days} ${days === 1 ? 'day' : 'days'}` : 'Pick the return day'}</T>
          {endAt && !tooShort && <T v="label" style={{ color: colors.orangeInk }}>{tierNote(days, tiers).split(' · ')[1]}</T>}
          <ErrorText error={tooShort ? `Rentals are at least ${MIN_HOURS} hours` : past ? 'Pickup time has passed' : closed ? 'Choose times within the selected desks’ opening hours (IST)' : null} />
        </View>
        <Button label="Done" style={{ width: 140 }} disabled={!endAt || tooShort || past || closed} onPress={() => { t.set({ startAt, endAt: endAt! }); router.back(); }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { height: 72, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  sumBox: { flex: 1, padding: 12, paddingHorizontal: 16, borderRadius: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  wd: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: fonts.regular, fontSize: 13, color: colors.muted, paddingBottom: 6 },
  cell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  day: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  todayDot: { position: 'absolute', bottom: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.orange },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderTopWidth: 1, borderTopColor: colors.line },
});
