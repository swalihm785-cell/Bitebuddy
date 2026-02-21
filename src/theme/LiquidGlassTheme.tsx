import React from 'react';
import { ViewProps, View, TouchableOpacity, TouchableOpacityProps, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * Liquid Glass Design System
 * 
 * Uses expo-blur's BlurView for a glass-like frosted effect that works
 * across Expo Go, development builds, iOS, and Android.
 * 
 * When running on iOS 26+ with a native dev build, you can swap this
 * to use @callstack/liquid-glass for the true native UIVisualEffectView.
 */

// Re-export for consumers that import LiquidGlassView directly
export const LiquidGlassView = View;

interface GlassProps extends ViewProps {
    effect?: 'regular' | 'clear';
    interactive?: boolean;
    colorScheme?: 'light' | 'dark' | 'system';
    onPress?: () => void;
}

/**
 * Primary Glass Container for cards and sections.
 * Uses expo-blur for a frosted glass effect.
 */
export const GlassCard: React.FC<GlassProps> = ({
    children,
    effect = 'regular',
    interactive = true,
    colorScheme = 'system',
    style,
    onPress,
    ...props
}) => {
    const tint = colorScheme === 'dark' ? 'dark' : colorScheme === 'light' ? 'light' : 'default';
    const intensity = effect === 'clear' ? 30 : 60;

    return (
        <View
            style={[glassStyles.cardOuter, style]}
            onStartShouldSetResponder={() => !!onPress}
            onTouchEnd={onPress}
            {...props}
        >
            <BlurView
                tint={tint}
                intensity={intensity}
                style={StyleSheet.absoluteFill}
            />
            <View style={glassStyles.cardContent}>
                {children}
            </View>
        </View>
    );
};

interface GlassButtonProps extends TouchableOpacityProps {
    effect?: 'regular' | 'clear';
    colorScheme?: 'system' | 'light' | 'dark';
}

/**
 * Interactive Glass Button with frosted backdrop.
 */
export const GlassButton: React.FC<GlassButtonProps> = ({
    children,
    effect = 'clear',
    colorScheme = 'system',
    style,
    ...props
}) => {
    const tint = colorScheme === 'dark' ? 'dark' : colorScheme === 'light' ? 'light' : 'default';
    const intensity = effect === 'clear' ? 25 : 50;

    return (
        <TouchableOpacity {...props} activeOpacity={0.7}>
            <View style={[glassStyles.buttonOuter, style]}>
                <BlurView
                    tint={tint}
                    intensity={intensity}
                    style={StyleSheet.absoluteFill}
                />
                <View style={glassStyles.buttonContent}>
                    {children}
                </View>
            </View>
        </TouchableOpacity>
    );
};

/**
 * Glass Container for screen backgrounds or large sections.
 */
export const GlassSection: React.FC<GlassProps> = ({
    children,
    effect = 'regular',
    colorScheme = 'system',
    style,
    ...props
}) => {
    const tint = colorScheme === 'dark' ? 'dark' : colorScheme === 'light' ? 'light' : 'default';

    return (
        <View style={[{ flex: 1, overflow: 'hidden' }, style]} {...props}>
            <BlurView
                tint={tint}
                intensity={50}
                style={StyleSheet.absoluteFill}
            />
            {children}
        </View>
    );
};

const glassStyles = StyleSheet.create({
    cardOuter: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    cardContent: {
        padding: 16,
    },
    buttonOuter: {
        borderRadius: 16,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContent: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
