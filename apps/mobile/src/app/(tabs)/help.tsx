import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Button, Card, Divider, Notice, Row, T } from '@/components/ui';
import { DESK_PHONE, SUPPORT_WHATSAPP } from '@/lib/contact';
import { call, whatsapp } from '@/lib/links';
import { colors } from '@/theme';

/** Answers use only the rules in the architecture document and the seeded prices. */
const FAQ = [
  { q: 'What do I bring to pickup?', a: 'Your original driving licence and an ID proof (Aadhaar or passport). Uploading them in Documents first makes pickup quicker.' },
  { q: 'How is my deposit refunded?', a: 'After the return inspection. Extra km, late return and any damage are taken out, and the rest goes back through Razorpay to the card or UPI you paid with.' },
  { q: 'Can I return at another location?', a: 'Yes. Choose a different return point when you book. A one-way return costs ₹400 including GST.' },
  { q: 'What if I ride more km?', a: 'Each bike includes a daily km allowance. Extra km are charged per km for that model, including GST, from your deposit.' },
  { q: 'Can I cancel?', a: 'More than 24 hours before pickup you get the full rental back; within 24 hours, half. The deposit is always refunded.' },
];

export default function Help() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 150, gap: 14 }}>
      <View><T v="hero">Help</T><T v="label" style={{ marginTop: 4 }}>Chat with the Valley Ride team on WhatsApp, or call the pickup desk.</T></View>
      <Row gap={10}>
        <Button label="Chat on WhatsApp" icon="chat" size="md" style={{ flex: 1 }} disabled={!SUPPORT_WHATSAPP} onPress={() => SUPPORT_WHATSAPP && whatsapp(SUPPORT_WHATSAPP, 'Hi Valley Ride, ')} />
        <Button label="Call desk" icon="phone" size="md" variant="secondary" style={{ flex: 1 }} disabled={!DESK_PHONE} onPress={() => DESK_PHONE && call(DESK_PHONE)} />
      </Row>
      {!SUPPORT_WHATSAPP && !DESK_PHONE && <Notice tone="field" icon="info" text="Support numbers are not set up in this build yet." />}

      <Card style={{ gap: 10, backgroundColor: colors.dark }}>
        <Row><Icon name="buoy" color={colors.surface} /><T style={{ color: colors.surface, fontSize: 18 }}>Breakdown or puncture?</T></Row>
        <T style={{ color: 'rgba(255,255,255,0.8)' }}>Message us with where you are and we'll guide you to help.</T>
        <Button label="Message roadside help" variant="tint" size="md" disabled={!SUPPORT_WHATSAPP}
          onPress={() => SUPPORT_WHATSAPP && whatsapp(SUPPORT_WHATSAPP, 'Roadside help: my bike has a problem. I am at ')} />
      </Card>

      <Card style={{ paddingVertical: 6 }}>
        <T style={{ fontSize: 18, paddingVertical: 10 }}>Common questions</T>
        {FAQ.map((f, i) => (
          <View key={f.q}>
            <Divider />
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: open === i }} aria-expanded={open === i} onPress={() => setOpen(open === i ? null : i)} style={styles.q}>
              <T style={{ flex: 1 }}>{f.q}</T>
              <Icon name={open === i ? 'chevronDown' : 'chevronRight'} size={18} color={colors.muted} />
            </Pressable>
            {open === i && <T v="label" style={{ paddingBottom: 14, lineHeight: 20 }}>{f.a}</T>}
          </View>
        ))}
      </Card>
      <Button label="Rental terms" variant="ghost" size="md" onPress={() => router.push('/terms')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({ q: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 } });
