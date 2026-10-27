import type { BookingDTO, CustomerDocumentDTO, LocationDTO, VehicleModelDTO } from '@valleyride/shared';
import { DOCUMENT_LABEL } from '@valleyride/shared';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapArt } from '@/components/art';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { BackButton, Button, Card, Divider, Line, LoadError, Loading, Notice, Row, T, Tag } from '@/components/ui';
import { api } from '@/lib/api';
import { bikePhoto, PHOTOS_HERO, shortName } from '@/lib/bikes';
import { DESK_PHONE } from '@/lib/contact';
import { pickupIn, STATUS_LABEL, timeLeft, useBooking, useCountdown, useHandover, useModels, type HandoverView } from '@/lib/data';
import { fmtDate, fmtDateTime, fmtTime, inr } from '@/lib/format';
import { call, openDirections } from '@/lib/links';
import { useTrip } from '@/lib/trip';
import { colors, fonts } from '@/theme';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { booking, error, reload } = useBooking(id);
  const { byId } = useModels();
  const { locations } = useTrip();
  const live = !!booking && ['ONGOING', 'COMPLETED', 'DEPOSIT_SETTLED', 'CONFIRMED'].includes(booking.status);
  const { handover, reload: reloadHandover } = useHandover(id, live);
  const [refreshing, setRefreshing] = useState(false);
  useFocusEffect(useCallback(() => { reload(); reloadHandover(); }, [reload, reloadHandover]));

  if (!booking) return error ? <LoadError error={error} onRetry={reload} /> : <Loading />;
  const model = byId(booking.vehicleModelId);
  const pickup = locations.find((l) => l.id === booking.pickupLocationId);
  const ret = locations.find((l) => l.id === booking.returnLocationId) ?? pickup;
  const props = { booking, model, pickup, ret, handover };
  const refresh = <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await Promise.all([reload(), reloadHandover()]); setRefreshing(false); }} />;

  if (booking.status === 'ONGOING') return <Ongoing {...props} refresh={refresh} />;
  if (booking.status === 'COMPLETED' || booking.status === 'DEPOSIT_SETTLED') return <Completed {...props} refresh={refresh} />;
  return <Upcoming {...props} refresh={refresh} />;
}

type P = { booking: BookingDTO; model?: VehicleModelDTO; pickup?: LocationDTO; ret?: LocationDTO; handover: HandoverView | null; refresh: React.ReactElement<any> };

function Screen({ title, sub, children, refresh }: { title: string; sub?: string; children: ReactNode; refresh: P['refresh'] }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ backgroundColor: colors.canvas }} refreshControl={refresh}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40, gap: 14 }}>
      <Row><BackButton /><View style={{ flexShrink: 1 }}><T v="title" style={{ letterSpacing: 1.5 }}>{title}</T>{sub && <T v="label">{sub}</T>}</View></Row>
      {children}
    </ScrollView>
  );
}

// ─── Upcoming: awaiting payment, confirmed, or closed without riding ──────────────────────────────

function Upcoming({ booking, model, pickup, handover, refresh }: P) {
  const [docs, setDocs] = useState<CustomerDocumentDTO[]>([]);
  useEffect(() => { api.get<CustomerDocumentDTO[]>('/kyc/documents').then(setDocs).catch(() => {}); }, []);
  const hold = useCountdown(booking.status === 'PENDING_PAYMENT' ? booking.holdExpiresAt : null);
  const closed = booking.status === 'CANCELLED' || booking.status === 'EXPIRED';
  const step = booking.status === 'CONFIRMED' ? 1 : 0;
  const dl = docs.find((d) => d.type === 'DL');
  const idDoc = docs.find((d) => d.type !== 'DL');
  const docState = (d?: CustomerDocumentDTO) => (!d ? 'Add before pickup' : d.status === 'VERIFIED' ? 'Verified' : d.status === 'PENDING' ? 'In review' : 'Needs a new photo');

  return (
    <Screen title={booking.code} sub={model?.name} refresh={refresh}>
      <Card style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tag label={STATUS_LABEL[booking.status]} tone={closed ? 'field' : booking.status === 'PENDING_PAYMENT' ? 'orange' : 'ink'} />
          {!closed && <T v="label" style={{ color: colors.orangeInk }}>{booking.status === 'PENDING_PAYMENT' ? `Held for ${hold.text}` : pickupIn(booking.startAt)}</T>}
        </View>
        {!closed && <Progress step={step} />}
        <View style={{ gap: 2 }}>
          <T style={{ fontSize: 17 }}>{fmtDateTime(booking.startAt)} → {fmtDateTime(booking.endAt)}</T>
          <T v="label">{booking.billableDays} {booking.billableDays === 1 ? 'day' : 'days'} · {booking.kmIncluded} km included</T>
        </View>
      </Card>

      {booking.status === 'PENDING_PAYMENT' && booking.pendingOrderId && hold.seconds > 0 && (
        <Button label={`Pay ${inr(booking.totalPaise, { decimals: 'always' })}`} onPress={() => router.push({
          pathname: '/pay', params: { bookingId: booking.id, orderId: booking.pendingOrderId!, amount: String(booking.totalPaise), code: booking.code, hold: booking.holdExpiresAt ?? '' },
        })} />
      )}

      {booking.status === 'CONFIRMED' && (
        <Card style={{ gap: 14 }}>
          <T style={{ fontSize: 18 }}>Before pickup</T>
          <CheckRow icon="idcard" label="Driving licence" value={docState(dl)} onPress={() => router.push('/documents')} />
          <CheckRow icon="idcard" label={idDoc ? `ID proof · ${DOCUMENT_LABEL[idDoc.type]} ${idDoc.numberMasked}` : 'ID proof'} value={docState(idDoc)} onPress={() => router.push('/documents')} />
          <CheckRow icon="pen" label="Rental agreement" value={handover?.pickup ? 'Ready to sign' : 'Sign at pickup'} />
          <CheckRow icon="camera" label="Pre-ride photos" value={handover?.pickup ? `${handover.pickup.photos.length} taken` : 'Taken by staff'} />
          {handover?.pickup && !handover.pickup.signedAt && (
            <Button label="Start pickup" onPress={() => router.push({ pathname: '/pickup/[id]', params: { id: booking.id } })} />
          )}
        </Card>
      )}

      {pickup && !closed && <PlaceCard place={pickup} title={pickup.name} />}

      {!closed && booking.status !== 'PENDING_PAYMENT' && (
        <Card style={{ gap: 12 }}>
          <T style={{ fontSize: 18 }}>Payment</T>
          <Line label="Paid" value={inr(booking.totalPaise, { decimals: 'always' })} strong />
          <Line label="Deposit held" sub="Returned after the return inspection" value={inr(booking.depositPaise, { decimals: 'always' })} />
          <Button label="View invoice" icon="download" variant="secondary" size="sm" style={{ backgroundColor: colors.field }}
            onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: booking.id } })} />
        </Card>
      )}

      {booking.status === 'CONFIRMED' && <Button label="Extend trip" variant="secondary" size="md" onPress={() => router.push({ pathname: '/extend/[id]', params: { id: booking.id } })} />}
      {(booking.status === 'CONFIRMED' || booking.status === 'PENDING_PAYMENT') && (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/cancel/[id]', params: { id: booking.id } })} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <T style={{ textDecorationLine: 'underline' }}>{booking.status === 'PENDING_PAYMENT' ? 'Release this hold' : 'Cancel booking'}</T>
        </Pressable>
      )}
      {closed && <Button label="Book again" onPress={() => router.push('/rides')} />}
    </Screen>
  );
}

function Progress({ step }: { step: number }) {
  const labels = ['Booked', 'Pickup', 'Return', 'Deposit back'];
  return (
    <View>
      <View style={[styles.track, { left: '12.5%', right: '12.5%', backgroundColor: colors.line }]} />
      <View style={[styles.track, { left: '12.5%', width: `${Math.min(step, 3) * 25}%`, backgroundColor: colors.ink }]} />
      <View style={{ flexDirection: 'row' }}>
        {labels.map((l, i) => (
          <View key={l} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
            {i < step || step === 4 ? <View style={[styles.dot, { backgroundColor: colors.ink }]}><Icon name="check" size={16} color={colors.surface} strokeWidth={2} /></View>
              : i === step ? <View style={[styles.dot, { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.orange }]}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange }} /></View>
                : <View style={[styles.dot, { backgroundColor: colors.field, borderWidth: 1, borderColor: colors.line }]} />}
            <T v="label" style={{ color: i <= step ? colors.ink : colors.muted }}>{l}</T>
          </View>
        ))}
      </View>
    </View>
  );
}

function CheckRow({ icon, label, value, onPress }: { icon: IconName; label: string; value: string; onPress?: () => void }) {
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={styles.icon}><Icon name={icon} size={20} /></View>
      <T style={{ flex: 1 }}>{label}</T>
      <T v="label" style={value === 'Needs a new photo' || value === 'Add before pickup' ? { color: colors.orangeInk } : undefined}>{value}</T>
      {onPress && <Icon name="chevronRight" size={18} color={colors.muted} />}
    </View>
  );
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress}>{body}</Pressable> : body;
}

function PlaceCard({ place, title }: { place: LocationDTO; title: string }) {
  return (
    <Card style={{ padding: 14, gap: 12 }}>
      <View style={{ borderRadius: 20, overflow: 'hidden' }}><MapArt height={120} /></View>
      <View style={{ paddingHorizontal: 4 }}><T style={{ fontSize: 17 }}>{title}</T><T v="label" style={{ marginTop: 2 }}>{place.address}</T></View>
      <Row gap={10}>
        <Button label="Directions" size="md" style={{ flex: 1 }} onPress={() => openDirections(place)} />
        <Button label="Call desk" size="md" variant="secondary" style={{ flex: 1, backgroundColor: colors.field }} disabled={!DESK_PHONE} onPress={() => DESK_PHONE && call(DESK_PHONE)} />
      </Row>
    </Card>
  );
}

// ─── On the ride ──────────────────────────────────────────────────────────────────────────────────

function Ongoing({ booking, model, ret, handover, refresh }: P) {
  const insets = useSafeAreaInsets();
  const [, tick] = useState(0);
  useEffect(() => { const h = setInterval(() => tick((n) => n + 1), 60_000); return () => clearInterval(h); }, []);
  const p = handover?.pickup;
  const left = timeLeft(booking.endAt);

  return (
    <ScrollView style={{ backgroundColor: colors.canvas }} refreshControl={refresh} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <Image source={PHOTOS_HERO.cover} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={{ left: '55%', top: '55%' }} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
        <View style={{ gap: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <BackButton />
            <View style={styles.live}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink }} /><Text style={{ fontFamily: fonts.medium, fontSize: 14 }}>On the ride</Text></View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, letterSpacing: 1, color: 'rgba(255,255,255,0.84)' }}>{booking.code}</Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={styles.heroSub}>{left.startsWith('Overdue') ? 'Return was due' : 'Return in'}</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 44, letterSpacing: -1, color: colors.surface }}>{left.replace('Overdue ', '')}</Text>
            <Text style={styles.heroSub}>by {fmtDateTime(booking.endAt)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Glass tone="dark" radius={20} style={styles.stat}><Text style={styles.statBig}>{booking.kmIncluded} km</Text><Text style={styles.statSmall}>included{model ? `, then ₹${model.extraKmPaise / 100}/km` : ''}</Text></Glass>
            <Glass tone="dark" radius={20} style={styles.stat}><Text style={styles.statBig}>{p ? `${String(p.odometerKm).padStart(5, '0')} km` : '—'}</Text><Text style={styles.statSmall}>odometer at pickup</Text></Glass>
          </View>
        </View>
      </View>

      <View style={{ padding: 20, paddingTop: 18, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tile icon="calendar" label="Extend" dark onPress={() => router.push({ pathname: '/extend/[id]', params: { id: booking.id } })} />
          <Tile icon="buoy" label="Roadside help" onPress={() => router.push('/(tabs)/help')} />
          <Tile icon="phone" label="Call desk" disabled={!DESK_PHONE} onPress={() => DESK_PHONE && call(DESK_PHONE)} />
        </View>
        <Card style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 14 }}>
          <View style={styles.thumb}>{model && <Image source={bikePhoto(model.slug)} style={{ width: 86, height: 60 }} contentFit="contain" />}</View>
          <View style={{ flex: 1 }}>
            <T style={{ fontSize: 17 }}>{model ? shortName(model.name) : 'Your bike'}</T>
            <T v="label" style={{ marginTop: 2 }}>{[handover?.registrationNo, p?.signedAt && `picked up ${fmtDate(p.signedAt)} ${fmtTime(p.signedAt)}`].filter(Boolean).join(' · ')}</T>
          </View>
        </Card>
        {ret && <PlaceCard place={ret} title={`Return to ${ret.name}`} />}
        <Button label="Signed agreement" icon="doc" variant="secondary" size="md" onPress={() => openAgreement(booking.id)} />
        <Notice text={`Running late? Extend before ${fmtTime(booking.endAt)} on ${fmtDate(booking.endAt)} so the bike isn't booked for someone else.`} />
      </View>
    </ScrollView>
  );
}

function Tile({ icon, label, dark, onPress, disabled }: { icon: IconName; label: string; dark?: boolean; onPress?: () => void; disabled?: boolean }) {
  const fg = dark ? colors.surface : disabled ? colors.disabled : colors.ink;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [styles.tile, { backgroundColor: dark ? colors.ink : colors.surface, opacity: pressed ? 0.85 : 1 }]}>
      <Icon name={icon} size={22} color={fg} />
      <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: fg }}>{label}</Text>
    </Pressable>
  );
}

// ─── Returned ─────────────────────────────────────────────────────────────────────────────────────

function Completed({ booking, model, ret, handover, refresh }: P) {
  const r = handover?.return;
  const p = handover?.pickup;
  const c = r?.charges;
  const late = c && c.lateHours > 0;
  return (
    <Screen title="Ride complete" sub={`${booking.code}${model ? ` · ${shortName(model.name)}` : ''}`} refresh={refresh}>
      {r && c && (
        <View style={styles.summary}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1 }}><Text style={styles.sumBig}>{c.kmRidden} km</Text><Text style={styles.sumSmall}>ridden in {booking.billableDays} {booking.billableDays === 1 ? 'day' : 'days'}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.sumBig}>{fmtTime(r.at)}</Text><Text style={styles.sumSmall}>returned, {late ? `${c.lateHours} h late` : 'on time'}</Text></View>
          </View>
          <View style={styles.sumFoot}>
            <Text style={styles.sumSmall}>Odometer {p ? String(p.odometerKm).padStart(5, '0') : '—'} → {String(r.odometerKm).padStart(5, '0')}</Text>
            {ret && <Text style={styles.sumSmall}>{ret.name}</Text>}
          </View>
        </View>
      )}
      {r && (
        <Card style={{ gap: 12 }}>
          <T style={{ fontSize: 18 }}>Inspection</T>
          <Check ok={!c?.damagePaise} text={c?.damagePaise ? `Damage charged · ${inr(c.damagePaise, { decimals: 'always' })}` : 'No new damage'} />
          {r.checklist && <Check ok={r.checklist.helmetsReturned && r.checklist.documentsReturned} text={r.checklist.helmetsReturned && r.checklist.documentsReturned ? 'Helmet and documents returned' : 'Helmet or documents missing'} />}
          {r.damageNotes && <T v="label">{r.damageNotes}</T>}
        </Card>
      )}
      {c && (
        <Card style={{ gap: 12, paddingHorizontal: 20 }}>
          <T style={{ fontSize: 18 }}>Deposit</T>
          <Line label="Deposit held" value={inr(booking.depositPaise, { decimals: 'always' })} />
          <Line label="Extra km" sub={c.extraKm ? `${c.extraKm} km over ${booking.kmIncluded}${model ? ` × ₹${model.extraKmPaise / 100}` : ''}, including GST` : undefined}
            value={minus(c.extraKmPaise + c.extraKmTaxPaise)} />
          <Line label="Late return" sub={c.lateHours ? `${c.lateHours} h, including GST` : undefined} value={minus(c.lateFeePaise + c.lateFeeTaxPaise)} />
          {c.damagePaise > 0 && <Line label="Damage" value={minus(c.damagePaise)} />}
          <Divider />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <T style={{ fontSize: 18 }}>{booking.status === 'DEPOSIT_SETTLED' ? 'Refunded to you' : 'Refunding to you'}</T>
            <T style={{ fontFamily: fonts.medium, fontSize: 24 }}>{inr(c.refundPaise, { decimals: 'always' })}</T>
          </View>
          {c.owedPaise > 0 && <Notice text={`Charges are ${inr(c.owedPaise, { decimals: 'always' })} more than the deposit. Our team will contact you.`} />}
        </Card>
      )}
      {!r && <Notice tone="field" icon="info" text="Our staff are finishing the return inspection." />}
      <Button label="Track deposit refund" onPress={() => router.push({ pathname: '/deposit/[id]', params: { id: booking.id } })} />
      <Row gap={10}>
        <Button label="Invoice" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: booking.id } })} />
        <Button label="Rate your ride" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/review/[id]', params: { id: booking.id } })} />
      </Row>
      <Button label="Question about these charges?" variant="ghost" size="sm" onPress={() => router.push('/(tabs)/help')} />
    </Screen>
  );
}

async function openAgreement(id: string) {
  try { const r = await api.get<{ url: string }>(`/bookings/${id}/agreement`); await Linking.openURL(r.url); }
  catch (e) { Alert.alert('Agreement', e instanceof Error ? e.message : 'Could not open the agreement'); }
}

const minus = (p: number) => (p ? '−' : '') + inr(p, { decimals: 'always' });

function Check({ ok, text }: { ok: boolean; text: string }) {
  return (
    <Row>
      <View style={[styles.checkDot, { backgroundColor: ok ? colors.ink : colors.orangeTint }]}><Icon name={ok ? 'check' : 'info'} size={14} color={ok ? colors.surface : colors.orangeInk} strokeWidth={2} /></View>
      <T style={{ flex: 1 }}>{text}</T>
    </Row>
  );
}

const styles = StyleSheet.create({
  track: { position: 'absolute', top: 14, height: 2 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  hero: { overflow: 'hidden', borderBottomLeftRadius: 36, borderBottomRightRadius: 36, backgroundColor: colors.heroBg, paddingHorizontal: 20, paddingBottom: 24 },
  heroSub: { fontFamily: fonts.regular, fontSize: 15, color: 'rgba(255,255,255,0.84)' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 32, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.orange },
  stat: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  statBig: { fontFamily: fonts.medium, fontSize: 18, color: colors.surface },
  statSmall: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  tile: { flex: 1, height: 96, borderRadius: 24, padding: 14, justifyContent: 'space-between' },
  thumb: { width: 96, height: 70, borderRadius: 18, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  summary: { backgroundColor: colors.dark, borderRadius: 28, padding: 20, gap: 16 },
  sumBig: { fontFamily: fonts.medium, fontSize: 32, color: colors.surface },
  sumSmall: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  sumFoot: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)' },
  checkDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
