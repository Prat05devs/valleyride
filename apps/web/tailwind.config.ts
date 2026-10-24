import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/** Tokens live in app/globals.css and match apps/mobile/src/theme. Light only, as in the design. */
export default {
  content: {
    // Resolve source globs beside this config, including when Next is invoked from the repo root.
    relative: true,
    files: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  },
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem' }, screens: { '2xl': '1280px' } },
    extend: {
      colors: {
        ink: 'var(--ink)', surface: 'var(--surface)', canvas: 'var(--canvas)', field: 'var(--field)', line: 'var(--line)',
        muted: 'var(--muted)', body: 'var(--body)', dark: 'var(--dark)', hero: 'var(--hero)', disabled: 'var(--disabled)',
        orange: { DEFAULT: 'var(--orange)', tint: 'var(--orange-tint)', ink: 'var(--orange-ink)' },
        // shadcn-style aliases used by components/ui
        background: 'var(--canvas)', foreground: 'var(--ink)', border: 'var(--line)', ring: 'var(--ink)',
        card: { DEFAULT: 'var(--surface)', foreground: 'var(--ink)' },
        primary: { DEFAULT: 'var(--ink)', foreground: 'var(--surface)' },
      },
      borderRadius: { card: '28px', tile: '22px', sheet: '32px', hero: '36px' },
      fontFamily: { sans: ['var(--font-urbanist)', 'system-ui', 'sans-serif'] },
      fontWeight: { normal: '400', medium: '500' },
    },
  },
  plugins: [animate],
} satisfies Config;
