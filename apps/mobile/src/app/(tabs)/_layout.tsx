import { Redirect, Tabs } from 'expo-router';
import { GlassTabBar } from '@/components/GlassTabBar';
import { Offline } from '@/components/ui';
import { useSession } from '@/lib/session';

export default function TabsLayout() {
  const { user, ready, offline, retry } = useSession();
  if (ready && !user && offline) return <Offline onRetry={retry} />;
  if (ready && !user) return <Redirect href="/welcome" />;
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#ECEEF0' } }} tabBar={(props) => <GlassTabBar {...(props as any)} />}>
      <Tabs.Screen name="index" options={{ title: 'Explore' }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="help" options={{ title: 'Help' }} />
    </Tabs>
  );
}
