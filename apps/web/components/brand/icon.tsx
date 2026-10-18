
/** Line icons from the design (24px grid, 1.6–1.7 stroke). Same set as apps/mobile/src/components/Icon.tsx. */
export type IconName =
  | 'search' | 'calendar' | 'user' | 'chat' | 'sliders' | 'pin' | 'clock' | 'plus' | 'x' | 'back' | 'forward' | 'menu'
  | 'check' | 'gauge' | 'shield' | 'mountain' | 'route' | 'receipt' | 'ticket' | 'idcard' | 'phone' | 'bell' | 'globe'
  | 'wallet' | 'doc' | 'logout' | 'camera' | 'pen' | 'download' | 'timer' | 'nav' | 'lock' | 'buoy' | 'info' | 'chevronDown' | 'chevronRight' | 'upload';

export function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 1.6, className }: { name: IconName; size?: number; color?: string; strokeWidth?: number; className?: string }) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {name === 'search' && (<><circle cx={11} cy={11} r={7} {...p} /><path d="M20 20l-3.6-3.6" {...p} /></>)}
      {name === 'calendar' && (<><rect x={3.5} y={5} width={17} height={15.5} rx={3.5} {...p} /><path d="M3.5 10h17M8 3v4M16 3v4" {...p} /><rect x={13.5} y={13.5} width={3} height={3} rx={0.8} {...p} /></>)}
      {name === 'user' && (<><circle cx={12} cy={8} r={3.6} {...p} /><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" {...p} /></>)}
      {name === 'chat' && (<><path d="M20 11.5c0 4.1-3.6 7.5-8 7.5-1.2 0-2.3-.2-3.3-.7L4 19.5l1.1-3.6C4.4 14.6 4 13.1 4 11.5 4 7.4 7.6 4 12 4s8 3.4 8 7.5z" {...p} /><path d="M8.6 11.6h.01M12 11.6h.01M15.4 11.6h.01" {...p} strokeWidth={2.4} /></>)}
      {name === 'sliders' && (<><path d="M4 7h10M18 7h2M4 17h2M10 17h10" {...p} /><circle cx={16} cy={7} r={2} {...p} /><circle cx={8} cy={17} r={2} {...p} /></>)}
      {name === 'pin' && (<><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" {...p} /><circle cx={12} cy={10} r={2.4} {...p} /></>)}
      {name === 'clock' && (<><circle cx={12} cy={12} r={8.5} {...p} /><path d="M12 7.5V12l3 2" {...p} /></>)}
      {name === 'plus' && <path d="M12 5v14M5 12h14" {...p} />}
      {name === 'x' && <path d="M6 6l12 12M18 6L6 18" {...p} />}
      {name === 'back' && <path d="M19 12H5M11 6l-6 6 6 6" {...p} />}
      {name === 'forward' && <path d="M5 12h14M13 6l6 6-6 6" {...p} />}
      {name === 'menu' && <path d="M4 7h16M4 12h16M4 17h16" {...p} />}
      {name === 'check' && <path d="M5 12.5l4.5 4.5L19 7.5" {...p} />}
      {name === 'gauge' && (<><path d="M4.5 16a7.5 7.5 0 1 1 15 0" {...p} /><path d="M12 16l3.5-4.5" {...p} /></>)}
      {name === 'shield' && (<><path d="M12 3.5l7 2.6v5.2c0 4.4-3 7.9-7 9.2-4-1.3-7-4.8-7-9.2V6.1l7-2.6z" {...p} /><path d="M9 12l2 2 4-4" {...p} /></>)}
      {name === 'mountain' && <path d="M3 19l6.5-10 4 6 2.5-3.5L21 19H3z" {...p} />}
      {name === 'route' && (<><circle cx={6} cy={18} r={2} {...p} /><circle cx={18} cy={6} r={2} {...p} /><path d="M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16" {...p} /></>)}
      {name === 'receipt' && (<><path d="M6 3.5h12v17l-2.2-1.4-2 1.4-1.8-1.4-1.8 1.4-2-1.4L6 20.5v-17z" {...p} /><path d="M9 8h6M9 11.5h6M9 15h3.5" {...p} /></>)}
      {name === 'ticket' && (<><path d="M4 8.5v-2h16v2a2.5 2.5 0 0 0 0 5v2H4v-2a2.5 2.5 0 0 0 0-5z" {...p} /><path d="M14 6.5v11" {...p} strokeDasharray="1.6 1.8" /></>)}
      {name === 'idcard' && (<><rect x={3} y={5} width={18} height={14} rx={2.5} {...p} /><circle cx={9} cy={11} r={2} {...p} /><path d="M6.5 16c.5-1.5 1.5-2.2 2.5-2.2s2 .7 2.5 2.2M14 10h4M14 13.5h3" {...p} /></>)}
      {name === 'phone' && <path d="M8 3.5H6.2A2.2 2.2 0 0 0 4 5.8C4.3 13.7 10.3 19.7 18.2 20a2.2 2.2 0 0 0 2.3-2.2V16l-3.8-1.6-2 2a12 12 0 0 1-5.1-5.1l2-2L10 3.5H8z" {...p} />}
      {name === 'bell' && (<><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5z" {...p} /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" {...p} /></>)}
      {name === 'globe' && (<><circle cx={12} cy={12} r={8.5} {...p} /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5s1.1-6.1 3.5-8.5z" {...p} /></>)}
      {name === 'wallet' && (<><rect x={3.5} y={6} width={17} height={13} rx={3} {...p} /><path d="M3.5 10h17M16 14.5h1.5" {...p} /></>)}
      {name === 'doc' && (<><path d="M7 3.5h7l4 4v13H7a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 7 3.5z" {...p} /><path d="M14 3.5v4h4M9 12h6M9 15.5h6" {...p} /></>)}
      {name === 'logout' && (<><path d="M14 4.5h3.5A2.5 2.5 0 0 1 20 7v10a2.5 2.5 0 0 1-2.5 2.5H14" {...p} /><path d="M10 8l-4 4 4 4M6 12h9" {...p} /></>)}
      {name === 'camera' && (<><path d="M4 8.5h3l1.5-2.5h7L17 8.5h3v10H4v-10z" {...p} /><circle cx={12} cy={13.2} r={3.2} {...p} /></>)}
      {name === 'pen' && (<><path d="M4 20l4.5-1 10-10-3.5-3.5-10 10L4 20z" {...p} /><path d="M13.5 7l3.5 3.5" {...p} /></>)}
      {name === 'download' && <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" {...p} />}
      {name === 'upload' && <path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14" {...p} />}
      {name === 'timer' && (<><circle cx={12} cy={13} r={7.5} {...p} /><path d="M12 9.5V13l2.2 1.6M10 3h4" {...p} /></>)}
      {name === 'nav' && <path d="M20 4L4 11l7 2 2 7 7-16z" {...p} />}
      {name === 'lock' && (<><rect x={5} y={10.5} width={14} height={10} rx={2.5} {...p} /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" {...p} /></>)}
      {name === 'buoy' && (<><circle cx={12} cy={12} r={8.5} {...p} /><circle cx={12} cy={12} r={3.5} {...p} /><path d="M6 6l3.5 3.5M14.5 14.5L18 18M18 6l-3.5 3.5M9.5 14.5L6 18" {...p} /></>)}
      {name === 'info' && (<><circle cx={12} cy={12} r={8.5} {...p} /><path d="M12 11v5M12 8h.01" {...p} /></>)}
      {name === 'chevronDown' && <path d="M6 9l6 6 6-6" {...p} />}
      {name === 'chevronRight' && <path d="M9 6l6 6-6 6" {...p} />}
    </svg>
  );
}
