import React, { useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AnimatedStarRowProps {
    value: number;
    onChange: (val: number) => void;
    size?: number;
    color?: string;
    emptyColor?: string;
}

// The star path from Figma (viewBox="0 0 40 38")
const STAR_PATH = 'M13.7 29.65L20 25.85L26.3 29.7L24.65 22.5L30.2 17.7L22.9 17.05L20 10.25L17.1 17L9.8 17.65L15.35 22.5L13.7 29.65ZM7.65 38L10.9 23.95L0 14.5L14.4 13.25L20 0L25.6 13.25L40 14.5L29.1 23.95L32.35 38L20 30.55L7.65 38Z';

export function AnimatedStarRow({
    value,
    onChange,
    size = 32,
    color = '#FFD700',
    emptyColor = '#353534',
}: AnimatedStarRowProps) {
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

    // viewBox is 40x38, so keep aspect ratio
    const starH = size * (38 / 40);

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
                        <Animated.View style={{ transform: [{ scale: scales[star - 1] }] }}>
                            <Svg width={size} height={starH} viewBox="0 0 40 38" fill="none">
                                <Path
                                    d={STAR_PATH}
                                    fill={filled ? color : emptyColor}
                                />
                            </Svg>
                        </Animated.View>
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
