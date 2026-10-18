import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorText, Notice, T } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, fonts } from '@/theme';

export default function Details() {
  const { user, updateProfile } = useSession();
  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: '/documents' | '/(tabs)') {
    setBusy(true); setError(null);
    try {
      await updateProfile({ fullName: name.trim(), email: email.trim() || null });
      router.replace(next);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not save'); } finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Scrolls so both buttons stay reachable on short phones and with the keyboard open. */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 22 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.step, { backgroundColor: colors.ink }]} /><View style={[styles.step, { backgroundColor: colors.line }]} />
          <T v="label">Step 1 of 2</T>
        </View>
        <View style={{ gap: 8 }}><T v="hero">Welcome aboard</T><T style={{ color: colors.muted }}>Your name goes on the rental agreement and invoices.</T></View>
        <View style={{ gap: 8 }}>
          <T v="label">Full name, as on your driving licence</T>
          <TextInput value={name} onChangeText={setName} autoComplete="name" textContentType="name" accessibilityLabel="Full name" style={styles.input} />
        </View>
        <View style={{ gap: 8 }}>
          <T v="label">Email for invoices (optional)</T>
          <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com"
            placeholderTextColor={colors.disabled} accessibilityLabel="Email" style={styles.input} />
        </View>
        <Notice icon="idcard" text="Next, add your driving licence. Verified riders get the bike handed over faster at pickup." />
        <ErrorText error={error} />
        <View style={{ marginTop: 'auto', gap: 10 }}>
          <Button label="Continue" onPress={() => save('/documents')} loading={busy} disabled={name.trim().length < 2} />
          <Button label="Skip for now" variant="ghost" size="md" onPress={() => save('/(tabs)')} disabled={name.trim().length < 2} />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  step: { flex: 1, height: 6, borderRadius: 999 },
  input: { height: 58, paddingHorizontal: 22, borderRadius: 999, backgroundColor: colors.field, fontFamily: fonts.regular, fontSize: 17, color: colors.ink },
});
