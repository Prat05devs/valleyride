import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton, Button, ErrorText, T } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, fonts } from '@/theme';

export default function Otp() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, requestOtp } = useSession();
  const [code, setCode] = useState('');
  const [left, setLeft] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<TextInput>(null);

  useEffect(() => { const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000); return () => clearInterval(t); }, []);

  async function verify(c = code) {
    if (c.length !== 6) return;
    setBusy(true); setError(null);
    try {
      const user = await verifyOtp(phone, c);
      router.replace(user.fullName ? '/(tabs)' : '/details');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
      setCode('');
    } finally { setBusy(false); }
  }

  async function resend(channel: 'sms' | 'whatsapp') {
    setError(null);
    try { await requestOtp(phone, channel); setLeft(30); } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not resend'); }
  }

  const pretty = phone ? `${phone.slice(0, 3)} ${phone.slice(3, 8)} ${phone.slice(8)}` : '';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ flex: 1, padding: 20, gap: 24 }}>
        <BackButton bg={colors.field} />
        <View style={{ gap: 8 }}>
          <T v="hero">Enter the code</T>
          <T style={{ color: colors.muted, lineHeight: 23 }}>We sent a 6-digit code to <Text style={{ color: colors.ink }}>{pretty}</Text>.</T>
        </View>
        <Pressable onPress={() => input.current?.focus()} accessibilityLabel="One-time code" style={styles.boxes}>
          {Array.from({ length: 6 }, (_, i) => {
            const active = i === code.length;
            return (
              <View key={i} style={[styles.box, code[i] ? styles.filled : active ? styles.active : styles.empty]}>
                <Text style={styles.digit}>{code[i] ?? ''}</Text>
              </View>
            );
          })}
        </Pressable>
        <TextInput ref={input} value={code} autoFocus keyboardType="number-pad" maxLength={6} textContentType="oneTimeCode" autoComplete="sms-otp"
          onChangeText={(t) => { const c = t.replace(/\D/g, ''); setCode(c); if (c.length === 6) verify(c); }} style={styles.hidden} accessibilityLabel="One-time code" />
        <ErrorText error={error} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {left > 0 ? <T v="label">Resend in <Text style={{ color: colors.ink }}>0:{String(left).padStart(2, '0')}</Text></T>
            : <Pressable onPress={() => resend('sms')} hitSlop={10}><T style={{ textDecorationLine: 'underline' }}>Resend code</T></Pressable>}
          <Button label="Send on WhatsApp" variant="secondary" size="sm" style={{ backgroundColor: colors.field }} onPress={() => resend('whatsapp')} disabled={left > 0} />
        </View>
        <View style={{ marginTop: 'auto', gap: 12 }}>
          <T v="label" style={{ textAlign: 'center' }}>Codes expire after 5 minutes.</T>
          <Button label="Verify" onPress={() => verify()} loading={busy} disabled={code.length !== 6} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filled: { borderWidth: 1.5, borderColor: colors.ink },
  active: { borderWidth: 2, borderColor: colors.orange },
  empty: { backgroundColor: colors.field },
  digit: { fontFamily: fonts.medium, fontSize: 24, color: colors.ink },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
