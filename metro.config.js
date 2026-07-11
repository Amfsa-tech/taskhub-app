const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow importing .svg files as React components via react-native-svg-transformer.
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Treat require() calls inside try/catch as optional, so modules that are only
// present in a development/production build (e.g. the native Google Sign-In SDK,
// referenced defensively in lib/auth/google.ts) don't break the Expo Go bundle.
config.resolver.allowOptionalDependencies = true;

module.exports = config;
