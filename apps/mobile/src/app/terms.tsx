import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, Button, Card, Row, T } from '@/components/ui';
import { WEB_URL } from '@/lib/links-web';
import { colors } from '@/theme';

/** Summary of the rules in the architecture document. The full legal text is owner-supplied. */
const SECTIONS = [
  { h: 'Booking and payment', p: 'A bike is held for 15 minutes while you pay. Rental, GST and the refundable deposit are paid together through Razorpay.' },
  { h: 'Cancellation', p: 'More than 24 hours before pickup, the full rental is refunded; within 24 hours, 50%. The deposit is always refunded.' },
  { h: 'At pickup', p: 'Bring your original driving licence and an ID proof. Staff take photos of the bike with you, and you sign the rental agreement in the app.' },
  { h: 'On the ride', p: 'Each booking includes a km allowance. Extra km and late returns are charged per the rates shown when you booked, including GST. Helmets are compulsory for rider and pillion.' },
  { h: 'Return and deposit', p: 'Damage found at return is charged from the deposit after inspection. The rest of the deposit goes back to the card or UPI you paid with.' },
  { h: 'Your data', p: 'Document photos are stored privately on our server and are available to authorised staff for verification. We keep only the last 4 characters of the document number you enter. A photo may still show the full number; use a masked Aadhaar if you choose to upload Aadhaar.' },
];

export default function Terms() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30, gap: 14 }}>
      <Row><BackButton /><T v="title">Rental terms and privacy</T></Row>
      {SECTIONS.map((s) => (
        <Card key={s.h} style={{ gap: 6 }}>
          <T style={{ fontSize: 18 }}>{s.h}</T>
          <T style={{ lineHeight: 23, color: colors.body }}>{s.p}</T>
        </Card>
      ))}
      <View style={{ gap: 8 }}>
        <T v="label" style={{ textAlign: 'center' }}>Prices, rates and terms are illustrative until reviewed for launch.</T>
        <Button label="Full terms on the website" variant="secondary" onPress={() => Linking.openURL(`${WEB_URL}/terms`)} />
      </View>
    </ScrollView>
  );
}
