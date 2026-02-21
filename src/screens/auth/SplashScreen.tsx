import React, { useEffect, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { isAuthenticated, hasCompletedProfile, hasCompletedOnboarding } = useAuthStore();

    const { currentTheme } = useThemeStore();
    const { Colors, FontSize, FontWeight } = currentTheme;
    const styles = useMemo(() => getStyles(Colors, FontSize, FontWeight), [currentTheme]);

    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const ringScale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(ringScale, { toValue: 1.3, duration: 1500, useNativeDriver: true }),
                        Animated.timing(ringScale, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
                    ]),
                ),
            ]),
            Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(() => {
            if (isAuthenticated && hasCompletedProfile) {
                navigation.replace('Main');
            } else if (hasCompletedOnboarding) {
                navigation.replace('Login');
            } else {
                navigation.replace('Onboarding');
            }
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    // Change gradient based on theme
    const bgColors = currentTheme === useThemeStore.getState().currentTheme && Colors.background === '#0F0F14'
        ? ['#0F0F14', '#1A0A22', '#0F0F14']
        : ['#FFFFFF', '#FFEBEB', '#FFFFFF'];

    return (
        <LinearGradient
            colors={bgColors as any}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View
                style={[
                    styles.ring,
                    { transform: [{ scale: ringScale }], opacity: 0.2 },
                ]}
            />
            <Animated.View
                style={[
                    styles.logoContainer,
                    { transform: [{ scale: logoScale }], opacity: logoOpacity },
                ]}
            >
                <LinearGradient
                    colors={['#FF6B35', '#FF3CAC']}
                    style={styles.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.logoEmoji}>🍽️</Text>
                </LinearGradient>
                <Text style={styles.logoText}>BiteBuddy</Text>
            </Animated.View>

            <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
                Dine Together, Connect Forever
            </Animated.Text>
        </LinearGradient>
    );
}

const getStyles = (Colors: any, FontSize: any, FontWeight: any) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ring: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoGradient: {
        width: 100,
        height: 100,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoEmoji: {
        fontSize: 48,
    },
    logoText: {
        fontSize: 36,
        fontWeight: FontWeight.extrabold,
        color: Colors.textPrimary,
        letterSpacing: -1,
    },
    tagline: {
        position: 'absolute',
        bottom: 80,
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        letterSpacing: 0.5,
    },
});
