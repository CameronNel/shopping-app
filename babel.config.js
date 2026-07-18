module.exports = function (api) {
  // Config varies by platform, so key the cache on it instead of caching blindly.
  const platform = api.caller((caller) => caller && caller.platform);
  api.cache.using(() => platform);

  const plugins = ['react-native-worklets/plugin'];

  if (platform === 'web') {
    // zustand/middleware ships `import.meta.env` inside its devtools helper. Metro
    // serves the web bundle as a classic <script>, where `import.meta` is a hard
    // SyntaxError that blanks the entire app before React can mount. Rewrite it to
    // `{}` so the guarded `import.meta.env` reads as undefined. Native builds, which
    // handle import.meta themselves, are left untouched.
    plugins.push(function neutralizeImportMetaOnWeb({ types: t }) {
      return {
        name: 'neutralize-import-meta-web',
        visitor: {
          MetaProperty(path) {
            const { meta, property } = path.node;
            if (meta?.name === 'import' && property?.name === 'meta') {
              path.replaceWith(t.objectExpression([]));
            }
          },
        },
      };
    });
  }

  return {
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins,
  };
};
