const colors = { line: '#E3E5E8', ink: '#000000', orange: '#F96407' };

const CONTOURS = ['M10 124 C60 104 82 132 132 112 S222 122 290 98', 'M10 98 C70 78 92 108 142 86 S232 94 290 72', 'M10 72 C80 54 102 82 152 60 S242 66 290 46', 'M10 46 C90 30 112 56 162 36 S252 40 290 22'];

/** Route preview on contour lines: a winding climb or a loop. Decorative. */
export function RouteArt({ kind = 'climb', height = 110 }: { kind?: 'climb' | 'loop'; height?: number | string }) {
  return (
    <svg width="100%" height={height} viewBox="0 0 300 140" aria-hidden="true">
      {CONTOURS.map((d) => <path key={d} d={d} stroke={colors.line} strokeWidth={1.5} fill="none" />)}
      {kind === 'climb' ? (
        <>
          <path d="M38 118 C72 112 94 98 90 84 C86 70 62 72 68 58 C74 44 112 52 124 40 C136 28 114 22 130 16 C152 8 192 30 216 22 C238 15 250 30 266 24" stroke={colors.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
          <circle cx={38} cy={118} r={6} fill={colors.ink} />
          <circle cx={266} cy={24} r={12} stroke={colors.orange} strokeWidth={1.5} strokeOpacity={0.45} fill="none" />
          <circle cx={266} cy={24} r={6.5} fill={colors.orange} />
        </>
      ) : (
        <>
          <path d="M74 104 C42 94 40 54 80 42 C120 30 150 52 190 38 C230 24 272 48 260 80 C250 106 212 98 182 110 C152 122 104 114 74 104 Z" stroke={colors.ink} strokeWidth={3} fill="none" />
          <circle cx={74} cy={104} r={12} stroke={colors.orange} strokeWidth={1.5} strokeOpacity={0.45} fill="none" />
          <circle cx={74} cy={104} r={6.5} fill={colors.orange} />
        </>
      )}
    </svg>
  );
}

/** Stylised map with the pickup pin. Stand-in until a maps SDK is added. */
export function MapArt({ height = 130 }: { height?: number | string }) {
  return (
    <svg width="100%" height={height} viewBox="0 0 350 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width={350} height={150} fill="#E9EBEE" />
      <path d="M-10 122 C80 104 150 130 360 96" stroke="#D7DCE2" strokeWidth={16} fill="none" />
      <path d="M0 62 L350 40" stroke="#FFFFFF" strokeWidth={12} />
      <path d="M118 0 L150 150" stroke="#FFFFFF" strokeWidth={8} />
      <path d="M262 0 L240 150" stroke="#FFFFFF" strokeWidth={6} />
      <path d="M0 102 L350 120" stroke="#FFFFFF" strokeWidth={5} />
      <rect x={164} y={66} width={62} height={28} rx={6} fill="#DCDFE3" />
      <ellipse cx={194} cy={76} rx={14} ry={5} fill="#000000" fillOpacity={0.1} />
      <path d="M194 28 C183 28 175 36 175 46 C175 60 194 76 194 76 C194 76 213 60 213 46 C213 36 205 28 194 28 Z" fill={colors.ink} />
      <circle cx={194} cy={46} r={6} fill={colors.orange} />
    </svg>
  );
}
