import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { BackButton, Card, Loading, Row, T } from '@/components/ui';
import { fmtDate, fmtTime } from '@/lib/format';
import { copyFor, useNotifications, type FeedItem } from '@/lib/notifications';
import { colors } from '@/theme';

const ICON: Record<FeedItem['kind'], IconName> = { doc: 'idcard', confirmed: 'check', return: 'clock', review: 'pen', deposit: 'wallet', refund: 'wallet' };
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const { items, readAt, unread, markAllRead } = useNotifications();
  const today = (items ?? []).filter((i) => isToday(i.at));
  const earlier = (items ?? []).filter((i) => !isToday(i.at));

  const open = (n: FeedItem) => {
    if (n.kind === 'doc') router.push('/documents');
    else if (n.kind === 'review' && n.bookingId) router.push({ pathname: '/review/[id]', params: { id: n.bookingId } });
    else if (n.bookingId) router.push({ pathname: '/trip/[id]', params: { id: n.bookingId } });
  };
  const group = (title: string, list: FeedItem[]) => list.length > 0 && (
    <View style={{ gap: 10 }}>
      <T v="label" style={{ paddingLeft: 4 }}>{title}</T>
      {list.map((n) => {
        const c = copyFor(n);
        const fresh = n.at > readAt;
        return (
          <Card key={n.id} onPress={() => open(n)} style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
            <View style={[styles.icon, n.kind === 'doc' && { backgroundColor: colors.orangeTint }]}><Icon name={ICON[n.kind]} size={20} color={n.kind === 'doc' ? colors.orangeInk : colors.ink} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <T style={{ fontSize: 16 }}>{c.title}</T>
              <T v="label" style={{ lineHeight: 20 }}>{c.body}</T>
              <T v="label" style={{ fontSize: 13, marginTop: 2 }}>{isToday(n.at) ? fmtTime(n.at) : fmtDate(n.at)}</T>
            </View>
            {fresh && <View style={styles.dot} />}
          </Card>
        );
      })}
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Row><BackButton /><T v="title">Notifications</T></Row>
        {unread > 0 && <Pressable accessibilityRole="button" onPress={markAllRead} hitSlop={10}><T style={{ color: colors.muted }}>Mark all read</T></Pressable>}
      </View>
      {!items ? <Loading /> : items.length === 0 ? <Card style={{ alignItems: 'center', paddingVertical: 28 }}><T>You're all caught up</T></Card> : (
        <>{group('Today', today)}{group('Earlier', earlier)}</>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange, marginTop: 4 },
});
