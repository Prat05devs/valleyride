import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, Button, ErrorText, Row, T } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, fonts } from '@/theme';

export default function ProfileEdit() {
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useSession();
  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true); setError(null);
    try { await updateProfile({ fullName: name.trim(), email: email.trim() || null }); router.back(); }
    catch (e) { setError(e instanceof ApiError ? (e.code === 'VALIDATION' ? 'Check the name and email.' : e.message) : 'Could not save'); }
    finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, padding: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20, gap: 18 }}>
        <Row><BackButton /><T v="title">Edit profile</T></Row>
        <View style={{ gap: 8 }}>
          <T v="label">Full name, as on your driving licence</T>
          <TextInput value={name} onChangeText={setName} autoComplete="name" accessibilityLabel="Full name" style={styles.input} />
        </View>
        <View style={{ gap: 8 }}>
          <T v="label">Email for invoices (optional)</T>
          <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" accessibilityLabel="Email" style={styles.input} />
        </View>
        <View style={{ gap: 8 }}>
          <T v="label">Mobile number</T>
          <View style={[styles.input, { justifyContent: 'center' }]}><T style={{ color: colors.muted }}>{user?.phone}</T></View>
          <T v="label">Your number is how you log in, so it can't be changed here.</T>
        </View>
        <ErrorText error={error} />
        <View style={{ flex: 1 }} />
        <Button label="Save" loading={busy} disabled={name.trim().length < 2} onPress={save} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  input: { height: 56, paddingHorizontal: 20, borderRadius: 999, backgroundColor: colors.surface, fontFamily: fonts.regular, fontSize: 16, color: colors.ink },
});
