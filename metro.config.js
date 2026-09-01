const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Compiles src/global.css (Tailwind directives) into NativeWind styles.
module.exports = withNativeWind(config, { input: './src/global.css' });
