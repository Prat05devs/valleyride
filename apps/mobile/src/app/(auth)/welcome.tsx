import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { InputAccessoryView, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ErrorText, T } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { PHOTOS_HERO } from '@/lib/bikes';
import { SUPPORT_WHATSAPP } from '@/lib/contact';
import { whatsapp } from '@/lib/links';
import { useSession } from '@/lib/session';
import { colors, fonts } from '@/theme';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { login } = useSession();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [digits, setDigits] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordInput = useRef<TextInput>(null);
  const phoneAccessoryId = 'valleyride-login-phone';
  const phone = '+91' + digits.replace(/\D/g, '');
  const valid = /^\+91[6-9]\d{9}$/.test(phone) && (mode === 'login' ? password.length > 0 : password.length >= 8);

  async function submit() {
    setBusy(true); setError(null);
    try {
      const user = await login(phone, password, mode === 'register');
      router.replace(user.fullName ? '/(tabs)' : '/details');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ALREADY_REGISTERED') { setMode('login'); setPassword(''); }
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.heroBg }}>
      <Image source={PHOTOS_HERO.welcome} style={styles.photo} contentFit="cover" contentPosition={{ left: "50%", top: "40%" }} />
      <View style={[styles.photo, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
      {/* iOS insets the ScrollView itself; Android (edge-to-edge, so no window resize) pads above the keyboard. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'android' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'} contentInsetAdjustmentBehavior="never"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled">
      <View style={[styles.brand, { paddingTop: insets.top + 40 }]}>
        <Image source={PHOTOS_HERO.logo} style={styles.logo} accessibilityLabel="Valley Ride two wheeler rental" />
        <T v="hero" style={{ color: colors.surface, textAlign: 'center' }}>Ride the valley</T>
        <T style={{ color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: 23 }}>Scooters and Royal Enfields for Dehradun, Mussoorie and Rishikesh.</T>
      </View>
        <View style={[styles.sheet, { marginTop: 'auto', paddingBottom: insets.bottom + 20 }]}>
          <View style={{ gap: 4 }}>
            <T v="title">{mode === 'login' ? 'Log in' : 'Create your account'}</T>
            <T v="label">{mode === 'login' ? 'Use your mobile number and password.' : 'Your mobile number is your login.'}</T>
          </View>
          <View style={{ gap: 8 }}>
            <T v="label">Mobile number</T>
            <View style={styles.field}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput value={digits} onChangeText={setDigits} keyboardType="phone-pad" maxLength={11} placeholder="98765 43210"
                placeholderTextColor={colors.disabled} accessibilityLabel="Mobile number" autoComplete="tel" textContentType="telephoneNumber"
                inputAccessoryViewID={Platform.OS === 'ios' ? phoneAccessoryId : undefined}
                returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordInput.current?.focus()}
                style={styles.input} />
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <T v="label">Password{mode === 'register' ? ' (at least 8 characters)' : ''}</T>
            <View style={[styles.field, { paddingRight: 8 }]}>
              <TextInput ref={passwordInput} value={password} onChangeText={setPassword} secureTextEntry={!show} maxLength={128} autoCapitalize="none" autoCorrect={false}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} textContentType={mode === 'login' ? 'password' : 'newPassword'}
                returnKeyType="go" accessibilityLabel="Password" style={styles.input} onSubmitEditing={valid && !busy ? submit : undefined} />
              <Pressable onPress={() => setShow(!show)} hitSlop={8} accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'} style={{ paddingHorizontal: 12 }}>
                <T style={{ textDecorationLine: 'underline' }}>{show ? 'Hide' : 'Show'}</T>
              </Pressable>
            </View>
          </View>
          <ErrorText error={error} />
          <Button label={mode === 'login' ? 'Log in' : 'Create account'} onPress={submit} loading={busy} disabled={!valid} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
            <Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} hitSlop={8} accessibilityRole="button">
              <T style={{ textDecorationLine: 'underline' }}>{mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}</T>
            </Pressable>
            {mode === 'login' && SUPPORT_WHATSAPP && (
              <Pressable onPress={() => whatsapp(SUPPORT_WHATSAPP, `Hi, I forgot my Valley Ride password. My number is ${phone}.`)} hitSlop={8} accessibilityRole="button">
                <T style={{ textDecorationLine: 'underline' }}>Forgot password?</T>
              </Pressable>
            )}
          </View>
          <T v="label" style={{ textAlign: 'center' }}>By continuing you agree to the rental terms and privacy policy.</T>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' && <InputAccessoryView nativeID={phoneAccessoryId}>
        <View style={styles.keyboardBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Dismiss keyboard" onPress={Keyboard.dismiss} style={styles.keyboardAction}>
            <T>Done</T>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Next, password" onPress={() => passwordInput.current?.focus()} style={styles.keyboardAction}>
            <T>Next</T>
          </Pressable>
        </View>
      </InputAccessoryView>}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { position: 'absolute', left: 0, right: 0, top: 0, height: '72%' },
  brand: { alignItems: 'center', gap: 16, paddingHorizontal: 36, paddingBottom: 24 },
  logo: { width: 96, height: 96, borderRadius: 48 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingTop: 26, gap: 16 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 58, paddingHorizontal: 22, borderRadius: 999, backgroundColor: colors.field },
  prefix: { fontFamily: fonts.regular, fontSize: 17, paddingRight: 12, borderRightWidth: 1, borderRightColor: '#D5D8DC' },
  input: { flex: 1, paddingVertical: 0, includeFontPadding: false, fontFamily: fonts.regular, fontSize: 17, color: colors.ink },
  keyboardBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.field, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  keyboardAction: { minHeight: 48, minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
});
