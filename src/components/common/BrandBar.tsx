import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import FudioLogo from '../FudioLogo';

/**
 * Shared top brand bar shown at the top of every screen.
 * Modified to precisely match the header styling from CreatePostScreen.
 */
export const BrandBar: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    const insets = useSafeAreaInsets();
    const { currentTheme } = useThemeStore();
    
    // Matches CreatePostScreen EXACTLY:
    const paddingTop = Platform.OS === 'ios' ? 16 : Math.max(insets.top, 10);

    return (
        <View style={[styles.bar, { paddingTop, backgroundColor: currentTheme.Colors.backgroundElevated }, style]}>
            <FudioLogo width={74} height={26} color={currentTheme.Colors.textPrimary} />
        </View>
    );
};

const styles = StyleSheet.create({
    bar: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 16,
    },
});

export default BrandBar;
