import { Redirect } from 'expo-router';
import { Loading, Offline } from '@/components/ui';
import { useSession } from '@/lib/session';

export default function Entry() {
  const { user, ready, offline, retry } = useSession();
  if (!ready) return <Loading />;
  if (offline && !user) return <Offline onRetry={retry} />;
  if (!user) return <Redirect href="/welcome" />;
  if (!user.fullName) return <Redirect href="/details" />;
  return <Redirect href="/(tabs)" />;
}
