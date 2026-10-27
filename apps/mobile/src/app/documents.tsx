import { DOCUMENT_LABEL, type CustomerDocumentDTO } from '@valleyride/shared';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { BackButton, Button, Card, Chip, ErrorText, Loading, Notice, Row, T, Tag } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { pickPhoto, uploadKyc, type PickedFile } from '@/lib/upload';
import { colors, fonts } from '@/theme';

type DocType = 'DL' | 'AADHAAR' | 'PASSPORT';

const STATUS: Record<CustomerDocumentDTO['status'], { label: string; tone: 'field' | 'ink' | 'orange' }> = {
  PENDING: { label: 'In review', tone: 'field' },
  VERIFIED: { label: 'Verified', tone: 'ink' },
  REJECTED: { label: 'Needs a new photo', tone: 'orange' },
};

export default function Documents() {
  const insets = useSafeAreaInsets();
  const [docs, setDocs] = useState<CustomerDocumentDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try { setDocs(await api.get<CustomerDocumentDTO[]>('/kyc/documents')); }
    catch { setError('Could not check your documents. Please try again.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const latest = (t: DocType) => docs?.find((d) => d.type === t);
  const id = latest('AADHAAR') ?? latest('PASSPORT');

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior="padding">
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Row><BackButton /><T v="title">Documents</T></Row>
        <T style={{ color: colors.muted }}>We check these before your first pickup. Bring the originals too.</T>
        {error ? <><ErrorText error={error} /><Button label="Try again" onPress={load} /></> : docs === null ? <Loading /> : <>
          <DocCard title="Driving licence" types={['DL']} current={latest('DL')} onSaved={load} />
          <DocCard title="ID proof" types={['AADHAAR', 'PASSPORT']} current={id} onSaved={load} />
        </>}
        <Notice tone="field" icon="lock" text="Files are private and available to authorised staff. Typed ID numbers are masked; photos may show the full number. Use a masked Aadhaar if you upload Aadhaar." />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DocCard({ title, types, current, onSaved }: { title: string; types: DocType[]; current?: CustomerDocumentDTO; onSaved: () => void }) {
  const [type, setType] = useState<DocType>(current?.type ?? types[0]!);
  const [number, setNumber] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const editing = !current || current.status === 'REJECTED' || replacing;

  async function choose(source: 'camera' | 'library') {
    setError(null);
    try { const f = await pickPhoto(source); if (f) setFile(f); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not open the camera'); }
  }

  async function submit() {
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const fileKey = await uploadKyc(type, file);
      await api.post('/kyc/documents', { type, number, fileKey });
      setFile(null); setNumber(''); setReplacing(false); onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? (e.details ? 'Check the number and try again.' : e.message) : 'Upload failed');
    } finally { setBusy(false); }
  }

  const numberLabel = type === 'DL' ? 'Licence number' : type === 'AADHAAR' ? 'Aadhaar number (12 digits)' : 'Passport number';
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T style={{ fontSize: 18 }}>{title}</T>
        {current ? <Tag label={STATUS[current.status].label} tone={STATUS[current.status].tone} /> : <Tag label="Not added" />}
      </View>
      {current && !editing && (
        <>
          <T v="label">{DOCUMENT_LABEL[current.type]} ending {current.numberMasked}{current.status === 'PENDING' ? " · we'll notify you when it's checked" : ''}</T>
          <Button label="Replace" variant="secondary" size="sm" onPress={() => setReplacing(true)} />
        </>
      )}
      {editing && (
        <>
          {current?.status === 'REJECTED' && !replacing && (
            <Notice text="We couldn't read the details. Take the photo in good light with all four corners visible." />
          )}
          {types.length > 1 && (
            <Row gap={8}>{types.map((t) => <Chip key={t} label={DOCUMENT_LABEL[t]} tone="field" selected={type === t} onPress={() => setType(t)} />)}</Row>
          )}
          <View style={{ gap: 6 }}>
            <T v="label">{numberLabel}</T>
            <TextInput value={number} onChangeText={setNumber} autoCapitalize="characters" autoCorrect={false}
              keyboardType={type === 'AADHAAR' ? 'number-pad' : 'default'} accessibilityLabel={numberLabel} style={styles.input} />
          </View>
          {file ? (
            <View style={styles.preview}>
              <Image source={{ uri: file.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.retake}><Button label="Retake" size="sm" variant="secondary" onPress={() => setFile(null)} /></View>
            </View>
          ) : (
            <Row gap={10}>
              <Button label="Take photo" icon="camera" size="md" style={{ flex: 1 }} onPress={() => choose('camera')} />
              <Button label="Upload file" icon="upload" size="md" variant="secondary" style={{ flex: 1, backgroundColor: colors.field }} onPress={() => choose('library')} />
            </Row>
          )}
          <ErrorText error={error} />
          {file && <Button label="Send for checking" loading={busy} disabled={number.replace(/\s/g, '').length < 4} onPress={submit} />}
          {replacing && <Button label="Keep the current one" variant="ghost" size="sm" onPress={() => setReplacing(false)} />}
        </>
      )}
      {!editing && current?.status === 'VERIFIED' && <Row gap={6}><Icon name="check" size={16} color={colors.muted} /><T v="label">Checked by our team</T></Row>}
    </Card>
  );
}

const styles = StyleSheet.create({
  input: { height: 54, paddingHorizontal: 20, borderRadius: 999, backgroundColor: colors.field, fontFamily: fonts.regular, fontSize: 16, letterSpacing: 1, color: colors.ink },
  preview: { height: 180, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.field },
  retake: { position: 'absolute', right: 10, bottom: 10 },
});
