import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { IconButton, T } from '@/components/ui';
import { WEB_URL } from '@/lib/links-web';
import { useNotifications } from '@/lib/notifications';
import { colors, fonts } from '@/theme';

export default function Menu() {
  const insets = useSafeAreaInsets();
  const { unread } = useNotifications();
  const go = (href: Parameters<typeof router.push>[0]) => () => { router.back(); router.push(href); };
  const items: { icon: IconName; label: string; onPress: () => void; badge?: number }[] = [
    { icon: 'gauge', label: 'Fleet and prices', onPress: go('/rides') },
    { icon: 'route', label: 'Routes', onPress: go('/routes') },
    { icon: 'pin', label: 'Pickup points', onPress: go('/pickup-point') },
    { icon: 'bell', label: 'Notifications', onPress: go('/notifications'), badge: unread },
    { icon: 'wallet', label: 'Payments and refunds', onPress: go('/payments') },
    { icon: 'chat', label: 'Help', onPress: go('/(tabs)/help') },
    { icon: 'doc', label: 'Rental terms', onPress: go('/terms') },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: colors.dark }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 24, color: colors.surface }}>Valley <Text style={{ color: colors.orange }}>Ride</Text></Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Dehradun · Mussoorie · Rishikesh</Text>
          </View>
          <IconButton icon="x" label="Close menu" onPress={() => router.back()} />
        </View>
        {items.map((i) => (
          <Pressable key={i.label} accessibilityRole="button" onPress={i.onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
            <Icon name={i.icon} color={colors.surface} />
            <Text style={styles.label}>{i.label}</Text>
            {i.badge ? <View style={styles.badge}><Text style={{ fontFamily: fonts.medium, fontSize: 13 }}>{i.badge}</Text></View> : null}
          </Pressable>
        ))}
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`${WEB_URL}/capital`)} style={styles.capital}>
          <T style={{ fontSize: 18 }}>Valley Ride Capital</T>
          <T v="label">Help fund the fleet. See the illustrative calculator.</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}><T>Open on the website</T><Icon name="forward" size={18} /></View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, height: 58, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)' },
  label: { flex: 1, fontFamily: fonts.regular, fontSize: 20, color: colors.surface },
  badge: { minWidth: 26, height: 26, paddingHorizontal: 8, borderRadius: 13, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  capital: { marginTop: 24, padding: 20, borderRadius: 28, backgroundColor: colors.surface, gap: 4 },
});
