import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors, fonts, radius, type } from '@/theme';
import { Icon, type IconName } from './Icon';

type Variant = keyof typeof type;

export function T({ v = 'body', style, children, numberOfLines }: { v?: Variant; style?: StyleProp<TextStyle>; children: ReactNode; numberOfLines?: number }) {
  return <Text style={[type[v], style]} numberOfLines={numberOfLines}>{children}</Text>;
}

/** Pill buttons. Primary is solid ink, as in the reference shots. */
export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, style, size = 'lg' }: {
  label: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'tint' | 'ghost'; icon?: IconName;
  loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; size?: 'lg' | 'md' | 'sm';
}) {
  const bg = { primary: colors.ink, secondary: colors.surface, tint: colors.orangeTint, ghost: 'transparent' }[variant];
  const fg = { primary: colors.surface, secondary: colors.ink, tint: colors.orangeInk, ghost: colors.ink }[variant];
  const h = { lg: 58, md: 50, sm: 44 }[size];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [styles.btn, { height: h, backgroundColor: off && variant === 'primary' ? colors.disabled : bg, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon && <Icon name={icon} size={20} color={fg} />}
          <Text style={[type.button, { color: fg, fontSize: size === 'sm' ? 15 : size === 'md' ? 16 : 18 }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/** 44px round icon button (back, close, menu). */
export function IconButton({ icon, onPress, label, bg = colors.surface, color = colors.ink, size = 44 }: {
  icon: IconName; onPress?: () => void; label: string; bg?: string; color?: string; size?: number;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={icon} color={color} />
    </Pressable>
  );
}

export const BackButton = ({ bg }: { bg?: string }) => <IconButton icon="back" label="Back" bg={bg} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, style, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}>{children}</Pressable>;
}

export function Chip({ label, selected, onPress, tone = 'light' }: { label: string; selected?: boolean; onPress?: () => void; tone?: 'light' | 'field' }) {
  const idle = tone === 'field' ? colors.field : colors.surface;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? colors.ink : idle }]}>
      <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: selected ? colors.surface : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

/** Small status / info pill. */
export function Tag({ label, tone = 'field' }: { label: string; tone?: 'field' | 'ink' | 'orange' }) {
  const bg = { field: colors.field, ink: colors.ink, orange: colors.orangeTint }[tone];
  const fg = { field: colors.ink, ink: colors.surface, orange: colors.orangeInk }[tone];
  return <View style={[styles.tag, { backgroundColor: bg }]}><Text style={{ fontFamily: fonts.regular, fontSize: 14, color: fg }}>{label}</Text></View>;
}

export function Row({ children, style, gap = 12 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Divider({ bleed = 0 }: { bleed?: number }) {
  return <View style={{ height: 1, backgroundColor: colors.line, marginHorizontal: -bleed }} />;
}

/** "Label ........ value" line used in price and detail cards. */
export function Line({ label, value, strong, muted, sub }: { label: string; value: string; strong?: boolean; muted?: boolean; sub?: string }) {
  const f = strong ? fonts.medium : fonts.regular;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <View style={{ flexShrink: 1 }}>
        <Text style={{ fontFamily: f, fontSize: 16, color: muted ? colors.muted : colors.ink }}>{label}</Text>
        {sub && <Text style={type.label}>{sub}</Text>}
      </View>
      <Text style={{ fontFamily: f, fontSize: 16, color: muted ? colors.muted : colors.ink }}>{value}</Text>
    </View>
  );
}

export function SectionHeader({ title, sub, action, onAction }: { title: string; sub?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20 }}>
      <View style={{ flexShrink: 1 }}><T v="title">{title}</T>{sub && <T v="label" style={{ marginTop: 2 }}>{sub}</T>}</View>
      {action && <Pressable accessibilityRole="link" onPress={onAction} hitSlop={10}><T style={{ color: colors.muted }}>{action}</T></Pressable>}
    </View>
  );
}

export function Notice({ text, tone = 'orange', icon }: { text: string; tone?: 'orange' | 'field'; icon?: IconName }) {
  const bg = tone === 'orange' ? colors.orangeTint : colors.field;
  const fg = tone === 'orange' ? colors.orangeInk : colors.ink;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, backgroundColor: bg }}>
      {icon ? <Icon name={icon} size={20} color={fg} /> : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange }} />}
      <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: fg }}>{text}</Text>
    </View>
  );
}

/** Round icon tile + label over value, used in confirmation and trip cards. */
export function InfoRow({ icon, label, value, right }: { icon: IconName; label: string; value: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={styles.infoIcon}><Icon name={icon} size={20} /></View>
      <View style={{ flex: 1 }}><T v="label">{label}</T><T style={{ fontSize: 17 }}>{value}</T></View>
      {right}
    </View>
  );
}

export function ErrorText({ error }: { error?: string | null }) {
  if (!error) return null;
  return <Text accessibilityRole="alert" style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.orangeInk }}>{error}</Text>;
}

/** Shown when the app cannot reach the API at start; the saved login is kept. */
export function Offline({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14, backgroundColor: colors.canvas }}>
      <Icon name="globe" size={36} />
      <T v="title" style={{ textAlign: 'center' }}>Can&apos;t reach Valley Ride</T>
      <T style={{ textAlign: 'center', color: colors.muted }}>Check your internet connection. You&apos;re still logged in.</T>
      <Button label="Try again" onPress={onRetry} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

export function Loading() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}><ActivityIndicator color={colors.ink} /></View>;
}

const styles = StyleSheet.create({
  btn: { borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 18 },
  chip: { height: 44, paddingHorizontal: 18, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  infoIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  tag: { alignSelf: 'flex-start', height: 30, paddingHorizontal: 12, borderRadius: radius.pill, justifyContent: 'center' },
});
