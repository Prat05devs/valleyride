import { DOCUMENT_LABEL, type CustomerDocumentDTO } from '@valleyride/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { Button, Card, Divider, T, Tag } from '@/components/ui';
import { api } from '@/lib/api';
import { useNotifications } from '@/lib/notifications';
import { useSession } from '@/lib/session';
import { colors, fonts } from '@/theme';

const fmtPhone = (p: string) => p.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2');

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useSession();
  const [docs, setDocs] = useState<CustomerDocumentDTO[] | null>(null);
  const { unread, reload } = useNotifications();
  useFocusEffect(useCallback(() => { api.get<CustomerDocumentDTO[]>('/kyc/documents').then(setDocs).catch(() => setDocs([])); reload(); }, [reload]));

  const dl = docs?.find((d) => d.type === 'DL');
  const id = docs?.find((d) => d.type !== 'DL');
  const all = !!dl && !!id && dl.status === 'VERIFIED' && id.status === 'VERIFIED';
  const state = (d?: CustomerDocumentDTO) => (!d ? 'Not added' : d.status === 'VERIFIED' ? 'Verified' : d.status === 'PENDING' ? 'In review' : 'Needs a new photo');
  const initial = (user?.fullName ?? user?.phone ?? '?').trim()[0]?.toUpperCase();

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 150, gap: 14 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <View style={styles.avatar}><Text style={{ fontFamily: fonts.medium, fontSize: 34, color: colors.surface }}>{initial}</Text></View>
        <T v="title" style={{ marginTop: 6 }}>{user?.fullName || 'Add your name'}</T>
        <T v="label">{user ? fmtPhone(user.phone) : ''}</T>
        <Button label="Edit profile" variant="secondary" size="sm" style={{ marginTop: 6, paddingHorizontal: 26 }} onPress={() => router.push('/profile-edit')} />
      </View>

      <Card onPress={() => router.push('/documents')} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T style={{ fontSize: 18 }}>Documents</T>
          {docs && <Tag label={all ? 'All verified' : 'Action needed'} tone={all ? 'ink' : 'orange'} />}
        </View>
        <DocLine label="Driving licence" value={state(dl)} />
        <DocLine label={id ? `ID proof · ${DOCUMENT_LABEL[id.type]} ${id.numberMasked}` : 'ID proof'} value={state(id)} />
      </Card>

      <Card style={{ paddingVertical: 6 }}>
        <Item icon="wallet" label="Payments and refunds" onPress={() => router.push('/payments')} />
        <Divider />
        <Item icon="bell" label="Notifications" badge={unread || undefined} onPress={() => router.push('/notifications')} />
        <Divider />
        <Item icon="globe" label="Language" value="English" />
        <Divider />
        <Item icon="doc" label="Rental terms and privacy" onPress={() => router.push('/terms')} />
      </Card>

      <Button label="Log out" icon="logout" variant="ghost" onPress={async () => { await logout(); router.replace('/welcome'); }} />
    </ScrollView>
  );
}

function DocLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <T style={{ flexShrink: 1 }}>{label}</T>
      <T v="label" style={value === 'Verified' ? undefined : { color: colors.orangeInk }}>{value}</T>
    </View>
  );
}

function Item({ icon, label, value, badge, onPress }: { icon: IconName; label: string; value?: string; badge?: number; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : 'text'} onPress={onPress} style={({ pressed }) => [styles.item, { opacity: pressed && onPress ? 0.6 : 1 }]}>
      <View style={styles.icon}><Icon name={icon} size={20} /></View>
      <T style={{ flex: 1 }}>{label}</T>
      {badge ? <View style={styles.badge}><Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.surface }}>{badge}</Text></View> : null}
      {value && <T v="label">{value}</T>}
      {onPress && <Icon name="chevronRight" size={18} color={colors.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  badge: { minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: 12, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
});
