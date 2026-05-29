module.exports = function (api) {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      // Bundles drizzle's generated .sql into migrations.js for the expo migrator.
      ['inline-import', { extensions: ['.sql'] }],
      // react-native-worklets/plugin auto-detects worklet boundaries. MUST be last.
      'react-native-worklets/plugin',
    ],
  }
}
