import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, Button, Card, Divider, ErrorText, Line, Loading, Row, T } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { fmtDate, inr } from '@/lib/format';
import { colors, fonts } from '@/theme';

interface Invoice {
  number: string; issuedAt: string; final: boolean;
  seller: { name: string; gstin: string | null; sac: string | null; address: string | null };
  billedTo: { name: string | null; phone: string | null }; bookingCode: string;
  lines: { label: string; amountPaise: number }[]; taxablePaise: number; gstPct: number;
  cgstPaise: number; sgstPaise: number; totalPaise: number; depositPaise: number;
}

const money = (p: number) => (p < 0 ? '−' : '') + inr(Math.abs(p), { decimals: 'always' });
const placeholder = (v: string | null, label: string) => v ?? `[${label}]`;

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.get<Invoice>(`/bookings/${id}/invoice`).then(setInv).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load the invoice')); }, [id]);

  if (error) return <View style={{ flex: 1, padding: 20, paddingTop: insets.top + 8, gap: 16 }}><BackButton /><ErrorText error={error} /></View>;
  if (!inv) return <Loading />;

  const text = [
    `${inv.seller.name} · Tax invoice ${inv.number}`, `Booking ${inv.bookingCode} · ${fmtDate(inv.issuedAt)}`,
    ...inv.lines.map((l) => `${l.label}: ${money(l.amountPaise)}`),
    `Taxable value: ${money(inv.taxablePaise)}`, `CGST ${inv.gstPct / 2}%: ${money(inv.cgstPaise)}`, `SGST ${inv.gstPct / 2}%: ${money(inv.sgstPaise)}`,
    `Total: ${money(inv.totalPaise)}`,
  ].join('\n');

  return (
    <ScrollView style={{ backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30, gap: 14 }}>
      <Row><BackButton /><T v="title">Invoice</T></Row>
      <Card style={{ gap: 16, padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View><T style={{ fontSize: 18 }}>{inv.seller.name}</T><T v="label">GSTIN {placeholder(inv.seller.gstin, 'your GSTIN')}</T></View>
          <View style={{ alignItems: 'flex-end' }}><T v="label">{inv.final ? 'Tax invoice' : 'Booking invoice'}</T><T style={{ letterSpacing: 0.5 }}>{inv.number}</T></View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View><T v="label">Billed to</T><T>{inv.billedTo.name ?? '—'}</T><T v="label">{inv.billedTo.phone}</T></View>
          <View style={{ alignItems: 'flex-end' }}><T v="label">Booking</T><T>{inv.bookingCode}</T><T v="label">Issued {fmtDate(inv.issuedAt)}</T></View>
        </View>
        <Divider />
        <Line label={`Item · SAC ${placeholder(inv.seller.sac, 'code')}`} value="Amount" muted />
        {inv.lines.map((l) => <Line key={l.label} label={l.label} value={money(l.amountPaise)} />)}
        <Divider />
        <Line label="Taxable value" value={money(inv.taxablePaise)} />
        <Line label={`CGST ${inv.gstPct / 2}%`} value={money(inv.cgstPaise)} />
        <Line label={`SGST ${inv.gstPct / 2}%`} value={money(inv.sgstPaise)} />
        <Divider />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><T style={{ fontSize: 18 }}>Total</T><T style={{ fontFamily: fonts.medium, fontSize: 24 }}>{money(inv.totalPaise)}</T></View>
        <T v="label" style={{ lineHeight: 20 }}>
          The {inr(inv.depositPaise)} refundable deposit is not part of this invoice.{inv.final ? '' : ' Extra km and late fees, if any, are added after the return.'} {placeholder(inv.seller.address, 'Registered business address')}
        </T>
      </Card>
      <Row gap={10}>
        <Button label="Share" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => Share.share({ message: text, title: inv.number })} />
        <Button label="Help" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => router.push('/(tabs)/help')} />
      </Row>
    </ScrollView>
  );
}
