import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Dimensions,
    TouchableOpacity, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme/theme';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');

const slides = [
    {
        emoji: '🍜',
        title: 'Discover Dining\nExperiences',
        subtitle: 'Find people who share your taste in food and join their dining plans.',
        gradient: ['#FF6B35', '#FF3CAC'] as [string, string],
    },
    {
        emoji: '👥',
        title: 'Connect Over\nShared Meals',
        subtitle: 'Host a dining event or join others nearby. Meet travelers, foodies, and expats.',
        gradient: ['#6C63FF', '#3CA5FF'] as [string, string],
    },
    {
        emoji: '⭐',
        title: 'Build Your\nFood Reputation',
        subtitle: 'Earn badges, collect reviews, and rise on the leaderboard as a top host.',
        gradient: ['#FFD166', '#FF6B35'] as [string, string],
    },
];

export default function OnboardingScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { setOnboardingComplete } = useAuthStore();
    const scrollRef = useRef<ScrollView>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleNext = () => {
        if (activeIndex < slides.length - 1) {
            scrollRef.current?.scrollTo({ x: width * (activeIndex + 1), animated: true });
            setActiveIndex(activeIndex + 1);
        } else {
            setOnboardingComplete();
            navigation.replace('Login');
        }
    };

    const handleScroll = (e: any) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveIndex(idx);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
            >
                {slides.map((slide, index) => (
                    <View key={index} style={styles.slide}>
                        <LinearGradient
                            colors={slide.gradient}
                            style={styles.emojiContainer}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.emoji}>{slide.emoji}</Text>
                        </LinearGradient>
                        <Text style={styles.title}>{slide.title}</Text>
                        <Text style={styles.subtitle}>{slide.subtitle}</Text>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.dots}>
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                i === activeIndex && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
                    <LinearGradient
                        colors={['#FF6B35', '#FF3CAC']}
                        style={styles.button}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.buttonText}>
                            {activeIndex < slides.length - 1 ? 'Next →' : 'Get Started'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.skip}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    slide: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: 200,
    },
    emojiContainer: {
        width: 140,
        height: 140,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    emoji: { fontSize: 72 },
    title: {
        fontSize: FontSize.xxxl,
        fontWeight: FontWeight.extrabold,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.md,
        lineHeight: 42,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
    },
    dots: { flexDirection: 'row', gap: 8 },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.border,
    },
    dotActive: {
        width: 24,
        backgroundColor: Colors.primary,
    },
    button: {
        paddingVertical: 16,
        paddingHorizontal: 60,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: '#FFF',
        letterSpacing: 0.5,
    },
    skip: { paddingVertical: 8 },
    skipText: { fontSize: FontSize.md, color: Colors.textMuted },
});
