const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/** 
 * Fix for PlatformConstants TurboModule error:
 * - Explicitly disable New Architecture (Fabric/TurboModules)
 * - Ensure iOS platform resolution
 */
config.resolver.platforms = ['ios', 'android', 'native'];
config.resolver.alias = {
  ...config.resolver.alias,
};

// Disable new architecture
config.transformer.unstable_allowRequireContext = true;

module.exports = config;

