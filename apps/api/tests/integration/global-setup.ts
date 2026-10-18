import { execSync } from 'node:child_process';
import IORedis from 'ioredis';

/** Rebuilds the test database from migrations + seeders before the run. Refuses anything not named *_test. */
export default async function setup() {
  const url = process.env.DATABASE_URL ?? 'postgres://valley:valley@localhost:5432/valleyride_test';
  const dbName = new URL(url).pathname.slice(1);
  if (!dbName.endsWith('_test')) throw new Error(`Refusing to run integration tests against "${dbName}"; use a *_test database.`);

  const env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: url };
  const run = (cmd: string) => execSync(`pnpm exec sequelize-cli ${cmd}`, { env, stdio: 'pipe', cwd: process.cwd() });
  run('db:migrate:undo:all');
  run('db:migrate');
  run('db:seed:all');

  // The rebuilt database has new ids, so cached catalogue rows and idempotency replays from earlier runs must go.
  const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379/1');
  for (const pattern of ['cache:*', 'idem:*']) { const keys = await redis.keys(pattern); if (keys.length) await redis.del(...keys); }
  await redis.quit();
}
