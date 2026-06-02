import React, { useEffect, useRef } from 'react';
import {
    View, TouchableOpacity, StyleSheet, StyleProp,
    ViewStyle, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

type FabSize = 'floating' | 'tab';

interface CreatePlanFabProps {
    onPress: () => void;
    size?: FabSize;
    style?: StyleProp<ViewStyle>;
    activeOpacity?: number;
}

const SIZE = {
    floating: { diameter: 64 },
    tab:      { diameter: 56 },
} as const;

export const CreatePlanFab: React.FC<CreatePlanFabProps> = ({
    onPress,
    size = 'floating',
    style,
    activeOpacity = 0.88,
}) => {
    const { diameter } = SIZE[size];
    const r = diameter / 2;
    const plusScale = diameter * 0.37;
    const waveWidth  = diameter * 3;
    const waveHeight = diameter * 2;

    // ── Idle: horizontal wave texture scroll, always running ─────────────────
    const scrollAnim = useRef(new Animated.Value(0)).current;

    // ── Press: liquid rises from below circle up to fully cover it ────────────
    // 0 = wave resting at ~60% height (idle position)
    // 1 = wave has risen to cover the full circle
    const fillAnim = useRef(new Animated.Value(0)).current;

    const fillTranslateY = fillAnim.interpolate({
        inputRange:  [0, 1],
        outputRange: [0, -(diameter * 0.68)],
    });

    useEffect(() => {
        // Horizontal texture scroll — always loops seamlessly
        Animated.loop(
            Animated.sequence([
                Animated.timing(scrollAnim, {
                    toValue: -diameter,
                    duration: 1800,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(scrollAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [diameter]);

    const handlePress = () => {
        // Rise from below (fillAnim: 0 → 1) then navigate, then silently reset
        Animated.timing(fillAnim, {
            toValue: 1,
            duration: 150,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
        }).start(() => {
            onPress();
            // Reset back to resting position after navigating (invisible while away)
            setTimeout(() => {
                fillAnim.setValue(0);
            }, 500);
        });
    };

    // Wave paths — 3 seamless horizontal tiles
    // Wave front sits at 60% height (resting), fills up on press via translateY
    const d = diameter;

    const waveFront = [
        `M 0 ${d * 0.60}`,
        `C ${d * 0.25} ${d * 0.42}, ${d * 0.75} ${d * 0.78}, ${d * 1.0} ${d * 0.60}`,
        `C ${d * 1.25} ${d * 0.42}, ${d * 1.75} ${d * 0.78}, ${d * 2.0} ${d * 0.60}`,
        `C ${d * 2.25} ${d * 0.42}, ${d * 2.75} ${d * 0.78}, ${d * 3.0} ${d * 0.60}`,
        `L ${d * 3} ${d * 2}`, `L 0 ${d * 2}`, 'Z',
    ].join(' ');

    return (
        <TouchableOpacity
            style={[style, styles.shadow]}
            onPress={handlePress}
            activeOpacity={activeOpacity}
            accessibilityRole="button"
            accessibilityLabel="Create dining plan"
        >
            <View style={{ width: diameter, height: diameter, borderRadius: r, overflow: 'hidden' }}>

                {/* Golden sphere gradient */}
                <LinearGradient
                    colors={['#FFF8E1', '#FFB534', '#E5900A']}
                    locations={[0, 0.55, 1]}
                    start={{ x: 0.3, y: 0 }}
                    end={{ x: 0.7, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Top-left sphere highlight */}
                <LinearGradient
                    colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
                    locations={[0, 0.7]}
                    start={{ x: 0.18, y: 0.05 }}
                    end={{ x: 0.75, y: 0.7 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                />

                {/* Wave: scrolls horizontally always; rises to fill on press */}
                <Animated.View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: waveWidth,
                        height: waveHeight,
                        transform: [
                            { translateX: scrollAnim },
                            { translateY: fillTranslateY },
                        ],
                    }}
                >
                    <Svg width={waveWidth} height={waveHeight} viewBox={`0 0 ${waveWidth} ${waveHeight}`}>
                        <Path d={waveFront} fill="#B75907" fillOpacity={0.5} />
                    </Svg>
                </Animated.View>

                {/* Plus icon */}
                <View style={styles.iconWrapper}>
                    <Svg
                        width={plusScale}
                        height={plusScale}
                        viewBox="0 0 21.5917 21.5917"
                        fill="none"
                    >
                        <Path
                            d="M9.25358 12.3381H0V9.25358H9.25358V0H12.3381V9.25358H21.5917V12.3381H12.3381V21.5917H9.25358V12.3381Z"
                            fill="#1E1B23"
                        />
                    </Svg>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    iconWrapper: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shadow: {
        shadowColor: '#FFB534',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 10,
    },
});

export default CreatePlanFab;
