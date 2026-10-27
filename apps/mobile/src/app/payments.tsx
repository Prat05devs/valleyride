import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { BackButton, Button, Card, ErrorText, Loading, Row, T } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtDate, inr } from '@/lib/format';
import { colors, fonts } from '@/theme';

interface Line { id: string; kind: 'PAID' | 'REFUND'; bookingId: string; bookingCode: string; amountPaise: number; at: string; note: string; pending: boolean }
interface Held { bookingId: string; bookingCode: string; bike: string; depositPaise: number; status: string }

export default function Payments() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<{ lines: Line[]; depositsHeld: Held[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setError(null); api.get<typeof data>('/me/payments').then(setData).catch(() => setError('Could not load payments and refunds. Please try again.')); }, [attempt]);

  return (
    <ScrollView style={{ backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30, gap: 14 }}>
      <Row><BackButton /><T v="title">Payments &amp; refunds</T></Row>
      {error && <><ErrorText error={error} /><Button label="Try again" onPress={() => setAttempt((n) => n + 1)} /></>}
      {!data ? (!error && <Loading />) : (
        <>
          {data.depositsHeld.map((h) => (
            <Card key={h.bookingId} style={{ backgroundColor: colors.dark, gap: 4 }} onPress={() => router.push({ pathname: '/trip/[id]', params: { id: h.bookingId } })}>
              <T style={{ color: 'rgba(255,255,255,0.8)' }}>Deposit held with us</T>
              <T style={{ color: colors.surface, fontFamily: fonts.medium, fontSize: 34 }}>{inr(h.depositPaise)}</T>
              <T style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                For {h.bookingCode} · {h.status === 'COMPLETED' ? 'refund on its way after the inspection.' : `refunded after you return the ${h.bike} and it passes inspection.`}
              </T>
            </Card>
          ))}
          <Card style={{ paddingVertical: 4 }}>
            {data.lines.length === 0 && <T v="label" style={{ paddingVertical: 16 }}>No payments yet.</T>}
            {data.lines.map((l, i) => (
              <View key={l.id} style={[styles.line, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}>
                <View style={[styles.icon, l.kind === 'REFUND' && { backgroundColor: colors.ink }]}>
                  <Icon name={l.kind === 'REFUND' ? 'download' : 'receipt'} size={18} color={l.kind === 'REFUND' ? colors.surface : colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <T>{l.kind === 'REFUND' ? l.note : 'Paid'} · {l.bookingCode}</T>
                  <T v="label">{fmtDate(l.at)} · {l.kind === 'REFUND' ? (l.pending ? 'on its way' : 'to the card or UPI you paid with') : l.note}</T>
                </View>
                <T style={{ fontFamily: fonts.medium }}>{l.kind === 'REFUND' ? '+' : ''}{inr(l.amountPaise, { decimals: 'always' })}</T>
              </View>
            ))}
          </Card>
          <T v="label" style={{ textAlign: 'center', paddingHorizontal: 10 }}>Payments go through Razorpay. Refunds return to the card or UPI you paid with.</T>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
});
