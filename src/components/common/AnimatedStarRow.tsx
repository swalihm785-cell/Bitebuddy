import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface AnimatedStarRowProps {
    value: number;
    onChange: (val: number) => void;
    size?: number;
    color?: string;
}

export function AnimatedStarRow({
    value,
    onChange,
    size = 32,
    color,
}: AnimatedStarRowProps) {
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    const starColor = color ?? Colors.accent;

    const scales = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

    const animateStar = (index: number) => {
        Animated.sequence([
            Animated.spring(scales[index], {
                toValue: 1.4,
                useNativeDriver: true,
                speed: 50,
                bounciness: 12,
            }),
            Animated.spring(scales[index], {
                toValue: 1,
                useNativeDriver: true,
                speed: 40,
                bounciness: 6,
            }),
        ]).start();
    };

    const handlePress = (star: number) => {
        animateStar(star - 1);
        onChange(star);
    };

    return (
        <View style={styles.row}>
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= value;
                return (
                    <TouchableOpacity
                        key={star}
                        onPress={() => handlePress(star)}
                        activeOpacity={0.7}
                    >
                        <Animated.Text
                            style={[
                                { fontSize: size, transform: [{ scale: scales[star - 1] }] },
                                { color: filled ? starColor : Colors.border },
                            ]}
                        >
                            {filled ? '★' : '☆'}
                        </Animated.Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
});
