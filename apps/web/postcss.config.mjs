import { fileURLToPath } from 'node:url';

// Tailwind otherwise searches process.cwd(), which can be the monorepo root on hosting platforms.
const config = {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.ts', import.meta.url)) },
    autoprefixer: {},
  },
};
export default config;
