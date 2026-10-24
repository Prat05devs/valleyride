// sequelize-cli config. Every environment reads DATABASE_URL; the app itself uses src/db/index.ts.
const path = require('node:path');

// Load apps/api/.env for local runs; CI and production pass real environment variables instead.
try { process.loadEnvFile(path.resolve(__dirname, '../../.env')); } catch { /* no .env file */ }

const common = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  migrationStorageTableName: 'SequelizeMeta',
  define: { underscored: true },
  ...((process.env.DATABASE_SSL ? process.env.DATABASE_SSL === 'true' : process.env.NODE_ENV === 'production')
    ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: true } } } : {}),
};

module.exports = {
  development: common,
  test: common,
  production: common,
};
