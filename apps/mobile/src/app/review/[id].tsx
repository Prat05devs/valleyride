import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Button, Chip, ErrorText, IconButton, T } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { shortName } from '@/lib/bikes';
import { useBooking, useModels } from '@/lib/data';
import { fmtDate } from '@/lib/format';
import { colors, fonts } from '@/theme';

const VERDICT = ['', 'Sorry it went badly', 'Not great', 'It was okay', 'Good ride', 'Loved it'];
const TAGS = ['Bike condition', 'Quick pickup', 'Friendly staff', 'Good value', 'Easy return'];

export default function Review() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { booking } = useBooking(id);
  const { byId } = useModels();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ rating: number; tags: string[]; comment: string | null } | null>(`/bookings/${id}/review`).then((r) => {
      if (r) { setRating(r.rating); setTags(r.tags); setComment(r.comment ?? ''); }
    }).catch(() => {});
  }, [id]);

  async function submit() {
    setBusy(true); setError(null);
    try { await api.put(`/bookings/${id}/review`, { rating, tags, comment: comment.trim() || undefined }); setDone(true); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not send'); } finally { setBusy(false); }
  }
  const model = booking && byId(booking.vehicleModelId);

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <T v="hero">Thank you</T>
        <T style={{ color: colors.muted, textAlign: 'center' }}>Your review helps other riders and our team.</T>
        <Button label="Done" style={{ alignSelf: 'stretch' }} onPress={() => router.dismissTo('/(tabs)/trips')} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior="padding">
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30, gap: 18 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignSelf: 'flex-end' }}><IconButton icon="x" label="Close" onPress={() => router.back()} /></View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <T v="hero">How was your ride?</T>
          {booking && <T v="label">{model ? `${shortName(model.name)} · ` : ''}{fmtDate(booking.startAt)} → {fmtDate(booking.endAt)}</T>}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }} accessibilityRole="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} accessibilityRole="radio" accessibilityLabel={`${n} ${n === 1 ? 'star' : 'stars'}`} accessibilityState={{ checked: n === rating }} aria-checked={n === rating} onPress={() => setRating(n)} hitSlop={4}>
              <Svg width={44} height={44} viewBox="0 0 24 24">
                <Path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill={n <= rating ? colors.orange : 'none'} stroke={n <= rating ? colors.orange : colors.disabled} strokeWidth={1.5} strokeLinejoin="round" />
              </Svg>
            </Pressable>
          ))}
        </View>
        <T style={{ textAlign: 'center', fontFamily: fonts.medium, fontSize: 18, minHeight: 24 }}>{VERDICT[rating]}</T>
        <View style={{ gap: 10 }}>
          <T v="label">What stood out?</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TAGS.map((t) => <Chip key={t} label={t} selected={tags.includes(t)} onPress={() => setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))} />)}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <T v="label">Anything else? (optional)</T>
          <TextInput value={comment} onChangeText={setComment} multiline maxLength={1000} accessibilityLabel="Comment" style={styles.area} />
        </View>
        <ErrorText error={error} />
        <Button label="Submit" loading={busy} disabled={!rating} onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  area: { minHeight: 110, padding: 18, borderRadius: 24, backgroundColor: colors.surface, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, textAlignVertical: 'top' },
});
