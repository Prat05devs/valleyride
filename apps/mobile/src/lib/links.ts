import type { LocationDTO } from '@valleyride/shared';
import { Linking, Platform } from 'react-native';

/** Opens Apple Maps on iOS and Google Maps elsewhere, by coordinates when the location has them. */
export function openDirections(loc: LocationDTO) {
  const q = loc.lat != null && loc.lng != null ? `${loc.lat},${loc.lng}` : `${loc.name}, ${loc.address}`;
  const url = Platform.OS === 'ios'
    ? `http://maps.apple.com/?daddr=${encodeURIComponent(q)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
  return Linking.openURL(url);
}

const gcal = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Google Calendar "add event" link; works on every platform without calendar permissions. */
export function addToCalendar(o: { title: string; start: string; end: string; location: string; details: string }) {
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(o.title)}`
    + `&dates=${gcal(new Date(o.start))}/${gcal(new Date(o.end))}&location=${encodeURIComponent(o.location)}&details=${encodeURIComponent(o.details)}`;
  return Linking.openURL(url);
}

export const call = (phone: string) => Linking.openURL(`tel:${phone}`);
export const whatsapp = (phone: string, text = '') => Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`);
