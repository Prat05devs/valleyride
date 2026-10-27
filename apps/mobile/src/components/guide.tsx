import type { Photo, RouteGuideDTO, VehicleSpecs } from '@valleyride/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Card, Line, T, Tag } from '@/components/ui';
import { openWebLink } from '@/lib/links';
import { colors, fonts } from '@/theme';

/** "Photo: author, licence", linking to the original: the credit Creative Commons photos need. */
export function PhotoCredit({ photo, light }: { photo: Photo; light?: boolean }) {
  const color = light ? 'rgba(255,255,255,0.75)' : colors.muted;
  return (
    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color }} onPress={photo.source ? () => openWebLink(photo.source!) : undefined} accessibilityRole={photo.source ? 'link' : 'text'}>
      Photo: <Text style={photo.source ? { textDecorationLine: 'underline' } : undefined}>{photo.credit}</Text>{photo.license ? `, ${photo.license}` : ''}
    </Text>
  );
}

export function Bullets({ items, color = colors.body }: { items: string[]; color?: string }) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((t) => (
        <View key={t} style={{ flexDirection: 'row', gap: 10 }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 16, color, lineHeight: 22 }}>•</Text>
          <T style={{ flex: 1, color, lineHeight: 22 }}>{t}</T>
        </View>
      ))}
    </View>
  );
}

function Score({ score }: { score: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }} accessible accessibilityLabel={`${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <View key={i} style={[styles.bar, { backgroundColor: i <= score ? colors.ink : colors.field }]} />)}
    </View>
  );
}

function SpecGroup({ title, rows, open: initial }: { title: string; rows: { label: string; value: string }[]; open: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 12 }}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} aria-expanded={open} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
        <T style={{ fontSize: 17 }}>{title}</T>
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={18} />
      </Pressable>
      {open && (
        <View style={{ gap: 10, marginTop: 8, paddingBottom: 4 }}>
          {rows.map((r) => (
            <View key={r.label} style={{ flexDirection: 'row', gap: 12 }}>
              <T v="label" style={{ width: '38%' }}>{r.label}</T>
              <T style={{ flex: 1, fontSize: 15 }}>{r.value}</T>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/** The model page's editorial half: overview, mileage, terrain fit, recommended routes, spec sheet, good to know. */
export function ModelSpecs({ name, specs, routes }: { name: string; specs: VehicleSpecs; routes: RouteGuideDTO[] }) {
  const m = specs.mileage;
  return (
    <>
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row' }}><Tag tone="orange" label={`${specs.modelYear} model · new`} /></View>
        <T style={{ fontSize: 18 }}>About the {name}</T>
        <T style={{ color: colors.body, lineHeight: 23 }}>{specs.overview}</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {specs.highlights.map((h) => (
            <View key={h.label} style={styles.stat}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 18, color: colors.ink }}>{h.value}</Text>
              <T v="label">{h.label}</T>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <T style={{ fontSize: 18 }}>Fuel economy</T>
        {m.claimed && <Line label="Claimed" value={m.claimed} />}
        <Line label="Real-world" value={m.realWorld} />
        <Line label="Fuel tank" value={`${m.tankL} litres`} />
        <Line label="Range" value={m.range} />
        {m.note ? <T v="label" style={{ lineHeight: 20 }}>{m.note}</T> : null}
      </Card>

      <Card style={{ gap: 14 }}>
        <T style={{ fontSize: 18 }}>How it handles Doon roads</T>
        {specs.terrain.map((t) => (
          <View key={t.label} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <T style={{ flex: 1, fontSize: 16 }}>{t.label}</T><Score score={t.score} />
            </View>
            <T v="label" style={{ lineHeight: 20, color: colors.body }}>{t.note}</T>
          </View>
        ))}
        {routes.length > 0 && (
          <View style={{ gap: 8, marginTop: 2 }}>
            <T style={{ fontSize: 16 }}>Recommended for these routes</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {routes.map((r) => (
                <Pressable key={r.id} onPress={() => router.push({ pathname: '/route/[slug]', params: { slug: r.slug } })} accessibilityRole="link" style={styles.routeChip}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.orangeInk }}>{r.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Card>

      <Card style={{ gap: 6 }}>
        <T style={{ fontSize: 18, marginBottom: 4 }}>Specifications</T>
        {specs.groups.map((g, i) => <SpecGroup key={g.title} title={g.title} rows={g.rows} open={i === 0} />)}
      </Card>

      {(specs.goodToKnow.length > 0 || specs.fromUs.length > 0) && (
        <Card style={{ gap: 12, backgroundColor: colors.orangeTint }}>
          <T style={{ fontSize: 18 }}>Good to know</T>
          <Bullets items={[...specs.fromUs, ...specs.goodToKnow]} color={colors.orangeInk} />
        </Card>
      )}

      {specs.sources.length > 0 && (
        <T v="label" style={{ paddingHorizontal: 4, lineHeight: 20 }}>
          Specifications from {specs.sources.map((s, i) => (
            <Text key={s.url} style={{ textDecorationLine: 'underline' }} onPress={() => openWebLink(s.url)}>{i > 0 ? ', ' : ''}{s.label}</Text>
          ))}. Figures can differ slightly by variant.
        </T>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bar: { width: 18, height: 7, borderRadius: 4 },
  stat: { flexGrow: 1, flexBasis: '45%', backgroundColor: colors.field, borderRadius: 18, padding: 12, gap: 2 },
  routeChip: { minHeight: 40, justifyContent: 'center', borderRadius: 999, backgroundColor: colors.orangeTint, paddingHorizontal: 14 },
});
