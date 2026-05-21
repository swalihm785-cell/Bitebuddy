import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FudioLogo from '../FudioLogo';

/**
 * Shared top brand bar shown at the top of every screen.
 * Extends behind the system status bar with the #1D1B22 surface color so the
 * status bar appears as a continuous strip with the fudio logo header.
 */
export const BrandBar: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    const insets = useSafeAreaInsets();
    
    // On Android, use SafeAreaInsets or StatusBar.currentHeight, plus a safe margin.
    // iOS is already reported as looking good.
    const androidPadding = (StatusBar.currentHeight || insets.top) + 16;
    const paddingTop = Platform.OS === 'android' ? androidPadding : Math.max(insets.top, 10);

    return (
        <View style={[styles.bar, { paddingTop }, style]}>
            <FudioLogo width={74} height={26} />
        </View>
    );
};

const styles = StyleSheet.create({
    bar: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 16,
        backgroundColor: '#1D1B22',
    },
});

export default BrandBar;
