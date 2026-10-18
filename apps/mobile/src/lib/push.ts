import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { api, kv } from './api';

const TOKEN_KEY = 'vr.pushToken';

if (Platform.OS !== 'web') Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/**
 * Registers this device for Expo push (Phase 3) after login. Needs a physical device and the EAS project id
 * (app.json extra.eas.projectId); without either it quietly does nothing and riders still get WhatsApp.
 */
export async function registerForPush() {
  try {
    if (!Device.isDevice || Platform.OS === 'web') return;
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    if (!projectId) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: 'Trips', importance: Notifications.AndroidImportance.HIGH });
    const perm = await Notifications.getPermissionsAsync();
    const granted = perm.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post('/me/push-tokens', { token, platform: Platform.OS });
    await kv.set(TOKEN_KEY, token);
  } catch { /* push is a convenience; WhatsApp carries every message too */ }
}

export async function unregisterPush() {
  const token = await kv.get(TOKEN_KEY);
  if (!token) return;
  await api.del('/me/push-tokens', { token }).catch(() => {});
  await kv.del(TOKEN_KEY);
}

/** Tapping a notification opens the trip it is about. */
export function listenForTaps() {
  if (Platform.OS === 'web') return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const bookingId = (r.notification.request.content.data as { bookingId?: string } | undefined)?.bookingId;
    if (bookingId) router.push({ pathname: '/trip/[id]', params: { id: bookingId } });
  });
  return () => sub.remove();
}
