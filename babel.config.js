module.exports = function (api) {
    api.cache(true);
    return {
        presets: [['babel-preset-expo', { worklets: false }]],
        // Reanimated 4 uses react-native-worklets under the hood; keep this last.
        plugins: ['react-native-reanimated/plugin'],
    };
};
