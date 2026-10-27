import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { BackButton, Button, Card, Divider, Line, LoadError, Loading, Row, T, Tag } from '@/components/ui';
import { useBooking, useHandover } from '@/lib/data';
import { fmtDateTime, inr } from '@/lib/format';
import { colors, fonts } from '@/theme';

export default function DepositRefund() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { booking, error, reload } = useBooking(id, { pollMs: 10_000, keepPolling: (b) => b.status === 'COMPLETED' });
  const { handover, error: handoverError, reload: reloadHandover } = useHandover(id);
  if (error || handoverError) return <LoadError error={(error || handoverError)!} onRetry={() => { void reload(); void reloadHandover(); }} />;
  if (!booking || !handover) return <Loading />;
  const r = handover.return;
  const c = r?.charges;
  const settled = booking.status === 'DEPOSIT_SETTLED';
  const steps = [
    { done: !!r, title: 'Bike returned and inspected', sub: r ? fmtDateTime(r.at) : 'At the desk' },
    { done: !!r, title: 'Refund sent through Razorpay', sub: r ? 'To the UPI or card you paid with' : 'After the inspection' },
    { done: settled, title: settled ? 'Refund processed' : 'Reaches your account', sub: settled ? 'Your bank credits it to the account you paid from.' : "Your bank credits it. We'll notify you once it settles." },
  ];

  return (
    <ScrollView style={{ backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30, gap: 14 }}>
      <Row><BackButton /><T v="title">Deposit refund</T></Row>
      <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 24 }}>
        <T v="label">Refunding to the account you paid from</T>
        <T style={{ fontFamily: fonts.medium, fontSize: 36 }}>{inr(c?.refundPaise ?? booking.depositPaise, { decimals: 'always' })}</T>
        <Tag label={settled ? 'Refunded' : r ? 'On its way' : 'After inspection'} tone={settled ? 'ink' : 'orange'} />
      </Card>
      <Card style={{ gap: 0 }}>
        {steps.map((s, i) => (
          <View key={s.title} style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.dot, { backgroundColor: s.done ? colors.ink : colors.field, borderWidth: s.done ? 0 : 1 }]}>{s.done && <Icon name="check" size={14} color={colors.surface} strokeWidth={2} />}</View>
              {i < steps.length - 1 && <View style={styles.line} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 18 }}><T>{s.title}</T><T v="label" style={{ marginTop: 2 }}>{s.sub}</T></View>
          </View>
        ))}
      </Card>
      {c && (
        <Card style={{ gap: 12 }}>
          <Line label="Deposit" value={inr(booking.depositPaise, { decimals: 'always' })} />
          {c.extraKmPaise > 0 && <Line label="Extra km, incl. GST" value={'−' + inr(c.extraKmPaise + c.extraKmTaxPaise, { decimals: 'always' })} />}
          {c.lateFeePaise > 0 && <Line label="Late return, incl. GST" value={'−' + inr(c.lateFeePaise + c.lateFeeTaxPaise, { decimals: 'always' })} />}
          {c.damagePaise > 0 && <Line label="Damage" value={'−' + inr(c.damagePaise, { decimals: 'always' })} />}
          <Divider />
          <Line label="Refund" value={inr(c.refundPaise, { decimals: 'always' })} strong />
          <Button label="View final invoice" variant="secondary" size="sm" style={{ backgroundColor: colors.field }} onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: booking.id } })} />
        </Card>
      )}
      <Button label="Rate your ride" onPress={() => router.push({ pathname: '/review/[id]', params: { id: booking.id } })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dot: { width: 26, height: 26, borderRadius: 13, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, width: 2, backgroundColor: colors.line, marginVertical: 2 },
});
