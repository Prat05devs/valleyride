import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Button, Divider, IconButton, Notice, T } from '@/components/ui';
import { fmtDate, fmtTime } from '@/lib/format';
import { tierNote, useTiers } from '@/lib/copy';
import { useTrip } from '@/lib/trip';
import { colors, fonts } from '@/theme';

function FieldButton({ icon, label, detail, onPress }: { icon: 'pin' | 'calendar' | 'clock'; label: string; detail?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.field, { opacity: pressed ? 0.8 : 1 }]}>
      <Icon name={icon} />
      <Text style={styles.fieldText} numberOfLines={1}>{label}</Text>
      {detail && <Text style={styles.fieldDetail} numberOfLines={1}>{detail}</Text>}
    </Pressable>
  );
}

export default function Search() {
  const tiers = useTiers();
  const t = useTrip();
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.head}>
        <View style={{ position: 'absolute', left: 20 }}><IconButton icon="x" label="Close" bg="transparent" onPress={() => router.back()} /></View>
        <T v="title">Pickup &amp; Return</T>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <T style={{ color: colors.muted }}>Pickup point</T>
        <FieldButton icon="pin" label={t.pickup?.name ?? 'Choose a pickup point'} detail={t.pickup?.address.split(',')[0]} onPress={() => router.push({ pathname: '/pickup-point', params: { which: 'pickup' } })} />
        {t.oneWay ? (
          <View style={{ gap: 8 }}>
            <T style={{ color: colors.muted }}>Return point</T>
            <FieldButton icon="pin" label={t.returnPoint?.name ?? 'Choose'} onPress={() => router.push({ pathname: '/pickup-point', params: { which: 'return' } })} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T v="label" style={{ color: colors.orangeInk }}>One-way fee ₹400 added</T>
              <Pressable onPress={() => t.set({ returnId: null })} hitSlop={10}><T style={{ textDecorationLine: 'underline', fontSize: 15 }}>Same as pickup</T></Pressable>
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
                  <FieldButton icon="calendar" label={fmtDate(d)} onPress={() => router.push('/dates')} />
                  <FieldButton icon="clock" label={fmtTime(d)} onPress={() => router.push('/dates')} />
                </View>
              </View>
            );
          })}
        </View>
        <Notice text={tierNote(t.days, tiers)} />
      </ScrollView>
      <View style={{ padding: 20, paddingTop: 10 }}>
        <Button label="Find rides" disabled={!t.pickupId} onPress={() => { router.back(); router.push('/rides'); }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { height: 72, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.field },
  fieldText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink },
  fieldDetail: { marginLeft: 'auto', fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  pair: { gap: 10, padding: 10, borderRadius: 26, borderWidth: 1, borderColor: colors.line },
  oneWay: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 48 },
});
