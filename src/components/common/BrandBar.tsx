import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import FudioLogo from '../FudioLogo';

/**
 * Shared top brand bar shown at the top of every screen.
 * Modified to precisely match the header styling from CreatePostScreen.
 */
export const BrandBar: React.FC<{ style?: ViewStyle; isModal?: boolean }> = ({ style, isModal = false }) => {
    const insets = useSafeAreaInsets();
    const { currentTheme } = useThemeStore();
    
    // Fall back to initialWindowMetrics top inset if insets.top is 0 to prevent transition layout jumps
    const topInset = insets.top || initialWindowMetrics?.insets?.top || 0;
    
    // On iOS, if it's a modal (slide screen), we use compact 16 padding since page sheets start below the status bar.
    // For static full-screens, we use Math.max(topInset, 16) to clear the status bar and Dynamic Island.
    const paddingTop = Platform.OS === 'ios'
        ? (isModal ? 16 : Math.max(topInset, 16))
        : Math.max(topInset, 10);

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
