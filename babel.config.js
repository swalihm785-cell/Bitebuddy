module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    alias: {
                        'react-native-worklets/plugin': 'react-native-worklets-core/plugin',
                        'react-native-worklets': 'react-native-worklets-core',
                    },
                },
            ],
            'react-native-reanimated/plugin',
        ],
    };
};
