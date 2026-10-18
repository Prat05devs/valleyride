import { Image, type ImageContentPosition } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PHOTOS_HERO } from '@/lib/bikes';
import { colors, radius } from '@/theme';

/** Darkened photo header with rounded bottom corners, as in the reference shots. */
export function PhotoHeader({ children, photo = 'cover', style, position = { left: '55%', top: '60%' } }: {
  children: ReactNode; photo?: 'cover' | 'welcome'; style?: StyleProp<ViewStyle>; position?: ImageContentPosition;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }, style]}>
      <Image source={PHOTOS_HERO[photo]} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={position} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderBottomLeftRadius: radius.hero, borderBottomRightRadius: radius.hero, backgroundColor: colors.heroBg, paddingHorizontal: 20, paddingBottom: 26 },
});
