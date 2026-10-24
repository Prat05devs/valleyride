import { cp, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const web = resolve(root, 'apps/web');
const standalone = resolve(web, '.next/standalone/apps/web');
await access(resolve(standalone, 'server.js'));
await cp(resolve(web, 'public'), resolve(standalone, 'public'), { recursive: true });
await cp(resolve(web, '.next/static'), resolve(standalone, '.next/static'), { recursive: true });
console.log('Hostinger output: apps/web/.next/standalone; entry: apps/web/server.js');
