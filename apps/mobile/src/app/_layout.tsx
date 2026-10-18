import { Urbanist_400Regular, Urbanist_500Medium, useFonts } from '@expo-google-fonts/urbanist';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '@/lib/session';
import { TripProvider } from '@/lib/trip';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({ Urbanist_400Regular, Urbanist_500Medium });
  useEffect(() => { if (loaded) SplashScreen.hideAsync().catch(() => {}); }, [loaded]);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <TripProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
            <Stack.Screen name="search" options={{ presentation: 'modal' }} />
            <Stack.Screen name="pickup-point" options={{ presentation: 'modal' }} />
            <Stack.Screen name="dates" options={{ presentation: 'modal' }} />
            <Stack.Screen name="cancel/[id]" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="menu" options={{ presentation: 'fullScreenModal', animation: 'fade', contentStyle: { backgroundColor: colors.dark } }} />
            <Stack.Screen name="review/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="pay" options={{ gestureEnabled: false }} />
            <Stack.Screen name="confirmed/[id]" options={{ gestureEnabled: false, animation: 'fade' }} />
          </Stack>
        </TripProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
