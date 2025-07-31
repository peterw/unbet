const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for nullthrows and other module resolution issues
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['require', 'import', 'react-native'];

// Ensure proper module resolution
config.resolver.nodeModulesPaths = [
  './node_modules',
];

// Reset cache to force fresh builds
config.resetCache = true;

// Cache configuration
config.cacheVersion = '2.0';

module.exports = config;