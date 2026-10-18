import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { PanResponder, Platform, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '@/theme';

export interface SignaturePadHandle { clear: () => void; toPng: () => Promise<string | null> }

/** Finger signature on a white SVG canvas; `toPng` returns a data URL (native) for the agreement record. */
export const SignaturePad = forwardRef<SignaturePadHandle, { height?: number; onChange?: (empty: boolean) => void }>(
  function SignaturePad({ height = 170, onChange }, ref) {
    const [paths, setPaths] = useState<string[]>([]);
    const current = useRef('');
    const [, redraw] = useState(0);
    const svg = useRef<Svg>(null);
    const size = useRef({ w: 0, h: height });

    const pan = useRef(PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => { const { locationX: x, locationY: y } = e.nativeEvent; current.current = `M${x.toFixed(1)},${y.toFixed(1)}`; redraw((n) => n + 1); },
      onPanResponderMove: (e) => { const { locationX: x, locationY: y } = e.nativeEvent; current.current += ` L${x.toFixed(1)},${y.toFixed(1)}`; redraw((n) => n + 1); },
      onPanResponderRelease: () => {
        const d = current.current; current.current = '';
        if (d) setPaths((p) => { const next = [...p, d]; onChange?.(false); return next; });
      },
    })).current;

    useImperativeHandle(ref, () => ({
      clear: () => { setPaths([]); onChange?.(true); },
      toPng: () => new Promise((resolve) => {
        if (!svg.current || Platform.OS === 'web') return resolve(null);
        svg.current.toDataURL((b64) => resolve(`data:image/png;base64,${b64}`), { width: Math.round(size.current.w), height: Math.round(size.current.h) });
      }),
    }));

    return (
      <View {...pan.panHandlers} accessibilityLabel="Signature area. Sign with your finger." style={{ height, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.field }}
        onLayout={(e) => { size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }; }}>
        <Svg ref={svg} width="100%" height="100%">
          <Rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF" />
          {paths.map((d, i) => <Path key={i} d={d} stroke={colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
          {current.current ? <Path d={current.current} stroke={colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
        </Svg>
      </View>
    );
  },
);
