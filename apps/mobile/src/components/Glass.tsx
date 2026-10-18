import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const nativeGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * Liquid glass surface. iOS 26+ uses the system Liquid Glass; older iOS and Android use a blur
 * with the style guide's recipe (white 34%, 1px white rim, top highlight).
 */
export function Glass({ children, style, tone = 'light', interactive = false, radius = 999 }: {
  children?: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'light' | 'dark'; interactive?: boolean; radius?: number;
}) {
  if (nativeGlass) {
    return <GlassView glassEffectStyle="regular" isInteractive={interactive} style={[styles.base, { borderRadius: radius }, style]}>{children}</GlassView>;
  }
  return (
    <View style={[styles.base, { borderRadius: radius }, style]}>
      <BlurView
        intensity={tone === 'dark' ? 30 : 40}
        tint={tone === 'dark' ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius }, tone === 'dark' ? styles.tintDark : styles.tintLight]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  tintLight: { backgroundColor: 'rgba(255,255,255,0.34)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)' },
  tintDark: { backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)' },
});
