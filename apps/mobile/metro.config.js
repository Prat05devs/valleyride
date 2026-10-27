// Monorepo: watch the workspace so packages/shared is bundled from source changes, and resolve
// modules from both this app and the workspace root (pnpm keeps deps per package).
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
// Keep archive/bundle memory bounded on developer Macs that are also compiling native code.
config.maxWorkers = 2;
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
