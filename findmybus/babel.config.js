module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      // NativeWind v4 ships a preset (it returns { plugins: [...] }), not a plugin.
      'nativewind/babel',
    ],
    // The Reanimated/Worklets babel plugin is added automatically by babel-preset-expo
    // whenever react-native-worklets is installed, so it must not be listed again here.
  };
};
