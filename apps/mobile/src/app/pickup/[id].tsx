import { RELATIONSHIPS, type BookingDTO } from '@valleyride/shared';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { SignaturePad, type SignaturePadHandle } from '@/components/SignaturePad';
import { BackButton, Button, Card, Chip, ErrorText, Line, Loading, Notice, Row, T } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { shortName } from '@/lib/bikes';
import { useBooking, useHandover, useModels } from '@/lib/data';
import { fmtDateTime, inr } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, fonts } from '@/theme';
import { lateFeePerHourPaise } from '@valleyride/shared';

const CHECKS = ['No dents', 'Tyres in good shape', 'Lights, horn and indicators work', 'Mirrors and helmet handed over', 'Brakes checked'];

/** Pickup, steps 1–3 on the rider's phone: agreement, bike condition, emergency contact → ONGOING. */
export default function Pickup() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { booking } = useBooking(id);
  const { byId } = useModels();
  const { handover, reload } = useHandover(id);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const pad = useRef<SignaturePadHandle>(null);
  const [signed, setSigned] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [mark, setMark] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rel, setRel] = useState<(typeof RELATIONSHIPS)[number]>('Family');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const model = booking && byId(booking.vehicleModelId);
  const p = handover?.pickup;
  if (!booking || !handover) return <Loading />;
  if (!p) return <Centered text="Staff will record the bike with you at the desk first. Then you can sign here." />;
  if (p.signedAt) return <Centered text="This ride has already started." />;

  async function sign() {
    setError(null);
    const png = await pad.current?.toPng();
    if (!png) { setError(Platform.OS === 'web' ? 'Signing works in the iOS and Android apps.' : 'Please sign in the box.'); return; }
    setSignature(png); setStep(2);
  }

  async function reportMark() {
    if (!mark || mark.trim().length < 3) return;
    setBusy(true); setError(null);
    try { await api.post(`/bookings/${id}/handover/report`, { note: mark.trim() }); setMark(null); await reload(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not send'); } finally { setBusy(false); }
  }

  async function start() {
    setBusy(true); setError(null);
    try {
      await api.post<BookingDTO>(`/bookings/${id}/start`, {
        signaturePng: signature, acceptedTerms: true, conditionConfirmed: true,
        emergencyContact: { name: name.trim(), phone: `+91${phone.replace(/\D/g, '')}`, relationship: rel },
      });
      router.replace({ pathname: '/trip/[id]', params: { id: booking!.id } });
    } catch (e) { setError(e instanceof ApiError ? (e.code === 'VALIDATION' ? 'Check the name and the 10-digit mobile number.' : e.message) : 'Could not start the ride'); }
    finally { setBusy(false); }
  }

  const titles = { 1: 'Rental agreement', 2: 'Bike condition', 3: 'Emergency contact' } as const;
  const back = () => (step === 1 ? router.back() : setStep((s) => (s - 1) as 1 | 2));
  const allChecked = CHECKS.every((c) => checks[c] !== false);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: 190, gap: 14 }} keyboardShouldPersistTaps="handled" scrollEnabled={step !== 1 || !signed}>
        <Row>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} style={styles.back}><Icon name="back" /></Pressable>
          <View><T v="title">{titles[step]}</T><T v="label">Pickup · step {step} of 3</T></View>
        </Row>
        <View style={{ flexDirection: 'row', gap: 6 }}>{[1, 2, 3].map((n) => <View key={n} style={[styles.bar, { backgroundColor: n <= step ? colors.ink : colors.line }]} />)}</View>

        {step === 1 && (
          <>
            <Card style={{ gap: 10 }}>
              <T style={{ fontSize: 18 }}>Key terms</T>
              <Line label="Rider" value={user?.fullName ?? user?.phone ?? ''} />
              <Line label="Bike" value={[model && shortName(model.name), handover.registrationNo].filter(Boolean).join(' · ')} />
              <Line label="Rental" value={`${fmtDateTime(booking.startAt)} →`} />
              <Line label="" value={fmtDateTime(booking.endAt)} />
              <Line label="Included" value={`${booking.kmIncluded} km${model ? ` · then ₹${model.extraKmPaise / 100}/km` : ''}`} />
              <Line label="Deposit" value={`${inr(booking.depositPaise)}, refundable`} />
              {model && <Line label="Late return" value={`${inr(lateFeePerHourPaise(model.pricePerDayPaise))} per hour + GST`} />}
              <T v="label" style={{ lineHeight: 20 }}>Damage found at return is charged from the deposit after inspection. Helmets for rider and pillion are compulsory.</T>
            </Card>
            <Card style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T style={{ fontSize: 18 }}>Your signature</T>
                <Pressable accessibilityRole="button" onPress={() => pad.current?.clear()} hitSlop={10}><T style={{ color: colors.muted }}>Clear</T></Pressable>
              </View>
              <SignaturePad ref={pad} onChange={(empty) => setSigned(!empty)} />
              {!signed && <T v="label" style={{ textAlign: 'center' }}>Sign here with your finger</T>}
            </Card>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: accepted }} onPress={() => setAccepted(!accepted)} style={styles.accept}>
              <View style={[styles.box, accepted && { backgroundColor: colors.ink, borderColor: colors.ink }]}>{accepted && <Icon name="check" size={16} color={colors.surface} strokeWidth={2} />}</View>
              <T style={{ flex: 1 }}>I have read the agreement and accept its terms, including the cancellation policy.</T>
            </Pressable>
          </>
        )}

        {step === 2 && (
          <>
            <T style={{ color: colors.muted, lineHeight: 22 }}>Our staff took these photos with you at the desk. They're compared with the bike at return, so check that every mark is noted.</T>
            <View style={styles.grid}>
              {p.photos.map((ph) => (
                <View key={ph.url} style={styles.photo}>
                  <Image source={{ uri: ph.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <View style={styles.photoLabel}><Text style={{ fontFamily: fonts.regular, fontSize: 13 }}>{ph.label}</Text></View>
                </View>
              ))}
            </View>
            <Row gap={10}>
              <Card style={{ flex: 1, padding: 14 }}><T style={{ fontFamily: fonts.medium, fontSize: 20 }}>{String(p.odometerKm).padStart(5, '0')}</T><T v="label">Odometer km</T></Card>
              {p.fuelLevel != null && <Card style={{ flex: 1, padding: 14 }}><T style={{ fontFamily: fonts.medium, fontSize: 20 }}>{p.fuelLevel}%</T><T v="label">Fuel</T></Card>}
            </Row>
            <Card style={{ gap: 12 }}>
              <T style={{ fontSize: 18 }}>Checklist</T>
              {p.damageNotes?.split('\n').map((n) => <Notice key={n} tone="field" icon="info" text={`${n}, noted`} />)}
              {CHECKS.map((c) => {
                const on = checks[c] !== false;
                return (
                  <Pressable key={c} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setChecks((s) => ({ ...s, [c]: !on }))} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.box, on && { backgroundColor: colors.ink, borderColor: colors.ink }]}>{on && <Icon name="check" size={16} color={colors.surface} strokeWidth={2} />}</View>
                    <T style={{ flex: 1 }}>{c}</T>
                  </Pressable>
                );
              })}
            </Card>
            {mark !== null && (
              <Card style={{ gap: 10 }}>
                <T v="label">Describe the mark and where it is</T>
                <TextInput value={mark} onChangeText={setMark} multiline placeholder="e.g. Dent on the rear mudguard" placeholderTextColor={colors.disabled} style={styles.area} accessibilityLabel="Describe the mark" />
                <Button label="Add to the checklist" size="md" loading={busy} disabled={mark.trim().length < 3} onPress={reportMark} />
              </Card>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <T style={{ color: colors.muted, lineHeight: 22 }}>Someone we can call if you can't be reached on the road. We only use it in an emergency.</T>
            <View style={{ gap: 6 }}>
              <T v="label">Name</T>
              <TextInput value={name} onChangeText={setName} autoComplete="name" accessibilityLabel="Contact name" style={styles.input} />
            </View>
            <View style={{ gap: 6 }}>
              <T v="label">Mobile number</T>
              <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                <T>+91</T>
                <TextInput value={phone} onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" accessibilityLabel="Contact mobile number"
                  style={{ flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink }} />
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <T v="label">Relationship</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{RELATIONSHIPS.map((r) => <Chip key={r} label={r} selected={rel === r} onPress={() => setRel(r)} />)}</View>
            </View>
            <Notice tone="field" icon="check" text="Agreement signed · bike condition confirmed" />
          </>
        )}
        <ErrorText error={error} />
      </ScrollView>

      <Glass radius={0} style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        {step === 1 && <Button label="Sign and continue" disabled={!signed || !accepted} onPress={sign} />}
        {step === 1 && <T v="label" style={{ textAlign: 'center' }}>A signed copy is sent to you on WhatsApp</T>}
        {step === 2 && <Button label="Looks right, continue" disabled={!allChecked || mark !== null} onPress={() => setStep(3)} />}
        {step === 2 && mark === null && <Button label="I see a mark that isn't noted" variant="ghost" size="md" onPress={() => setMark('')} />}
        {step === 3 && <Button label="Start ride" loading={busy} disabled={name.trim().length < 2 || phone.length !== 10} onPress={start} />}
      </Glass>
    </KeyboardAvoidingView>
  );
}

function Centered({ text }: { text: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, padding: 20, paddingTop: insets.top + 8, gap: 20 }}>
      <BackButton />
      <Notice tone="field" icon="info" text={text} />
    </View>
  );
}

const styles = StyleSheet.create({
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  accept: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: colors.disabled, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photo: { width: '48%', flexGrow: 1, aspectRatio: 1.2, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.field },
  photoLabel: { position: 'absolute', left: 8, bottom: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.88)' },
  area: { minHeight: 90, padding: 16, borderRadius: 22, backgroundColor: colors.field, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, textAlignVertical: 'top' },
  input: { height: 56, paddingHorizontal: 20, borderRadius: 999, backgroundColor: colors.surface, fontFamily: fonts.regular, fontSize: 16, color: colors.ink },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 8, paddingHorizontal: 20, paddingTop: 14 },
});
