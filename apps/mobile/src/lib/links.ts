import type { LocationDTO } from '@valleyride/shared';
import { Alert, Linking } from 'react-native';

/** Google Maps universal directions use the booking's configured coordinates or address. */
export function openDirections(loc: LocationDTO) {
  const q = loc.lat != null && loc.lng != null ? `${loc.lat},${loc.lng}` : `${loc.name}, ${loc.address}`;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=driving`;
  return Linking.openURL(url).catch(() => { Alert.alert('Pickup and return directions', `${loc.name}\n${loc.address}\nOpen Google Maps and search this address, or call the desk from your trip.`); });
}

const gcal = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Google Calendar "add event" link; works on every platform without calendar permissions. */
export function addToCalendar(o: { title: string; start: string; end: string; location: string; details: string }) {
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(o.title)}`
    + `&dates=${gcal(new Date(o.start))}/${gcal(new Date(o.end))}&location=${encodeURIComponent(o.location)}&details=${encodeURIComponent(o.details)}`;
  return Linking.openURL(url);
}

/** Credit and source links come from editable content, so only https opens (never intent:, tel: or app schemes). */
export const openWebLink = (url: string) => (/^https:\/\//i.test(url) ? Linking.openURL(url).catch(() => {}) : undefined);

export const call = (phone: string) => Linking.openURL(`tel:${phone}`);
export const whatsapp = (phone: string, text = '') => Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`);
