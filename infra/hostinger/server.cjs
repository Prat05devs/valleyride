// Hostinger entry file ("Other" preset, root ./, output directory empty): starts the Next.js standalone server that
// "pnpm build:hostinger" builds, from inside the installed repository so its package links stay intact.
// Hostinger sets PORT. HOSTNAME is forced because hosts often set it to the machine name, and Next.js would then
// listen only on that address instead of on every interface.
process.env.HOSTNAME = '0.0.0.0';
require('../../apps/web/.next/standalone/apps/web/server.js');
