import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ErrorText, T } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { PHOTOS_HERO } from '@/lib/bikes';
import { useSession } from '@/lib/session';
import { colors, fonts } from '@/theme';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { requestOtp } = useSession();
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phone = '+91' + digits.replace(/\D/g, '');
  const valid = /^\+91[6-9]\d{9}$/.test(phone);

  async function submit() {
    setBusy(true); setError(null);
    try {
      await requestOtp(phone);
      router.push({ pathname: '/otp', params: { phone } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.heroBg }}>
      <Image source={PHOTOS_HERO.welcome} style={styles.photo} contentFit="cover" contentPosition={{ left: "50%", top: "40%" }} />
      <View style={[styles.photo, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
      <View style={[styles.brand, { paddingTop: insets.top + 40 }]}>
        <Image source={PHOTOS_HERO.logo} style={styles.logo} accessibilityLabel="Valley Ride two wheeler rental" />
        <T v="hero" style={{ color: colors.surface, textAlign: 'center' }}>Ride the valley</T>
        <T style={{ color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: 23 }}>Scooters and Royal Enfields for Dehradun, Mussoorie and Rishikesh.</T>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ marginTop: 'auto' }}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={{ gap: 4 }}><T v="title">Log in</T><T v="label">We'll text a 6-digit code to your phone.</T></View>
          <View style={{ gap: 8 }}>
            <T v="label">Mobile number</T>
            <View style={styles.field}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput value={digits} onChangeText={setDigits} keyboardType="phone-pad" maxLength={11} placeholder="98765 43210"
                placeholderTextColor={colors.disabled} accessibilityLabel="Mobile number" autoComplete="tel" textContentType="telephoneNumber"
                style={styles.input} onSubmitEditing={valid ? submit : undefined} />
            </View>
          </View>
          <ErrorText error={error} />
          <Button label="Get OTP" onPress={submit} loading={busy} disabled={!valid} />
          <T v="label" style={{ textAlign: 'center' }}>By continuing you agree to the rental terms and privacy policy.</T>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { position: 'absolute', left: 0, right: 0, top: 0, height: '72%' },
  brand: { alignItems: 'center', gap: 16, paddingHorizontal: 36 },
  logo: { width: 96, height: 96, borderRadius: 48 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingTop: 26, gap: 16 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 58, paddingHorizontal: 22, borderRadius: 999, backgroundColor: colors.field },
  prefix: { fontFamily: fonts.regular, fontSize: 17, paddingRight: 12, borderRightWidth: 1, borderRightColor: '#D5D8DC' },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 17, color: colors.ink },
});
