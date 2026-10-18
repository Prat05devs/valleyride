import { formatOpenHours } from '@valleyride/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { IconButton, T } from '@/components/ui';
import { useTrip } from '@/lib/trip';
import { colors } from '@/theme';

export default function PickupPoint() {
  const { which } = useLocalSearchParams<{ which: 'pickup' | 'return' }>();
  const t = useTrip();
  const selected = which === 'return' ? (t.returnId ?? t.pickupId) : t.pickupId;
  const cities = [...new Set(t.locations.map((l) => l.city))];

  function pick(id: string) {
    if (which === 'return') t.set({ returnId: id === t.pickupId ? null : id });
    else t.set({ pickupId: id });
    router.back();
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.head}>
        <View style={{ position: 'absolute', left: 20 }}><IconButton icon="back" label="Back" bg="transparent" onPress={() => router.back()} /></View>
        <T v="title">{which === 'return' ? 'Return point' : 'Pickup point'}</T>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
        {which === 'return' && <T v="label">Returning somewhere else adds a ₹400 one-way fee.</T>}
        {cities.map((city) => (
          <View key={city} style={{ gap: 10 }}>
            <T v="label" style={{ paddingTop: 8, paddingLeft: 6 }}>{city}</T>
            {t.locations.filter((l) => l.city === city).map((l) => {
              const on = l.id === selected;
              return (
                <Pressable key={l.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => pick(l.id)}
                  style={[styles.row, { borderColor: on ? colors.ink : colors.line }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T style={{ fontSize: 17 }}>{l.name.split(' · ')[1] ?? l.name}</T>
                    <T v="label">{l.address}</T>
                    {formatOpenHours(l.openHours) && <T v="label">{formatOpenHours(l.openHours)}</T>}
                  </View>
                  <View style={[styles.radio, on && { backgroundColor: colors.ink, borderColor: colors.ink }]}>{on && <Icon name="check" size={14} color={colors.surface} strokeWidth={2.6} />}</View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { height: 72, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 24, borderWidth: 1.5 },
  radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: '#D5D8DC', alignItems: 'center', justifyContent: 'center' },
});
