import base from '@valleyride/eslint-config';
import globals from 'globals';

export default [
  ...base,
  {
    // sequelize-cli migrations and seeders are plain CommonJS
    files: ['src/db/migrations/**/*.js', 'src/db/seeders/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];
