import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { Glass } from './Glass';
import { Icon, type IconName } from './Icon';

const ICONS: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'search', label: 'Explore' },
  trips: { icon: 'calendar', label: 'Trips' },
  profile: { icon: 'user', label: 'Profile' },
  help: { icon: 'chat', label: 'Help' },
};

interface Props {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { emit: (e: any) => any; navigate: (name: string) => void };
  unreadHelp?: boolean;
}

/** The floating row of glass circles; the active tab is a solid ink circle. */
export function GlassTabBar({ state, navigation, unreadHelp = false }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 8 }]}>
      <Glass style={styles.capsule} interactive>
        {state.routes.map((route, i) => {
          const meta = ICONS[route.name];
          if (!meta) return null;
          const focused = state.index === i;
          const onPress = () => {
            const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !ev.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable key={route.key} onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} aria-selected={focused}
              accessibilityLabel={meta.label + (route.name === 'help' && unreadHelp && !focused ? ', unread message' : '')}
              style={({ pressed }) => [styles.circle, focused ? styles.active : styles.idle, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
              <Icon name={meta.icon} size={24} color={focused ? colors.surface : colors.ink} strokeWidth={1.7} />
              {route.name === 'help' && unreadHelp && !focused && <View style={styles.dot} />}
            </Pressable>
          );
        })}
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  capsule: { flexDirection: 'row', gap: 6, padding: 6, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 17, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  circle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colors.ink, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 6 } },
  idle: { backgroundColor: 'rgba(255,255,255,0.58)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)' },
  dot: { position: 'absolute', top: 11, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange, borderWidth: 2, borderColor: colors.surface },
});
