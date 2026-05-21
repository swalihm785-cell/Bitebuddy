import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useThemeStore } from '../../store/useThemeStore';
import { useHostReputationStore } from '../../store/useHostReputationStore';
import { RootStackParamList } from '../../types';
import { TastePointsBadge } from '../../components/dining/TastePointsBadge';

const { width } = Dimensions.get('window');

const CONFETTI_ITEMS = ['🍕', '🌮', '🍜', '🥘', '🍱', '🎉', '✨', '⭐', '🏆', '🍴'];

export default function ReviewSuccessScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<any>();
    const { hostId, postId } = route.params as { hostId: string; postId: string };
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    const insets = useSafeAreaInsets();
    const { getReputation } = useHostReputationStore();

    const rep = getReputation(hostId);

    // Animations
    const scale = useRef(new Animated.Value(0)).current;
    const fade = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(60)).current;
    const confettiAnims = useRef(CONFETTI_ITEMS.map(() => ({
        y: new Animated.Value(-100),
        x: new Animated.Value(Math.random() * width - width / 2),
        opacity: new Animated.Value(1),
        rotate: new Animated.Value(0),
    }))).current;

    useEffect(() => {
        // Main entrance
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 14 }),
            Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(slideUp, { toValue: 0, useNativeDriver: true, speed: 10, bounciness: 8 }),
        ]).start();

        // Confetti fall
        confettiAnims.forEach((anim, i) => {
            Animated.sequence([
                Animated.delay(i * 80),
                Animated.parallel([
                    Animated.timing(anim.y, {
                        toValue: 900,
                        duration: 2000 + Math.random() * 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.opacity, {
                        toValue: 0,
                        duration: 2000,
                        delay: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.rotate, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start();
        });

        // Auto-dismiss after 4s
        const timer = setTimeout(() => {
            if (navigation.canGoBack()) navigation.goBack();
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            {/* Confetti layer */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {confettiAnims.map((anim, i) => (
                    <Animated.Text
                        key={i}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: width / 2 + (i % 5 - 2) * 70,
                            fontSize: 24,
                            opacity: anim.opacity,
                            transform: [
                                { translateY: anim.y },
                                {
                                    rotate: anim.rotate.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', `${(i % 2 === 0 ? 1 : -1) * 360}deg`],
                                    }),
                                },
                            ],
                        }}
                    >
                        {CONFETTI_ITEMS[i]}
                    </Animated.Text>
                ))}
            </View>

            <SafeAreaView style={styles.content}>
                <Animated.View style={[styles.card, { opacity: fade, transform: [{ scale }] }]}>
                    <LinearGradient
                        colors={['#FFB534', '#FF8A1F']}
                        style={styles.successCircle}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={{ fontSize: 48 }}>🎉</Text>
                    </LinearGradient>

                    <Text style={[styles.title, { color: Colors.textPrimary }]}>
                        Review Submitted!
                    </Text>
                    <Text style={[styles.subtitle, { color: Colors.textMuted }]}>
                        Thank you for sharing your dining experience with the community.
                    </Text>

                    {rep.totalTastePoints > 0 && (
                        <View style={[styles.pointsBanner, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}>
                            <Text style={styles.pointsBannerIcon}>👨‍🍳</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.pointsBannerTitle, { color: Colors.textPrimary }]}>
                                    Host Now Has
                                </Text>
                                <TastePointsBadge points={rep.totalTastePoints} tier={rep.tier} size="md" showTier />
                            </View>
                        </View>
                    )}
                </Animated.View>

                <Animated.View style={[styles.actions, { opacity: fade, transform: [{ translateY: slideUp }] }]}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('HostRewards', { hostId })}
                        style={{ borderRadius: 28, overflow: 'hidden', marginBottom: 12 }}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#FFB534', '#FF8A1F']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.primaryBtn}
                        >
                            <Text style={styles.primaryBtnText}>View Host Rewards 🏆</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Main' as any)}
                        style={[styles.secondaryBtn, { borderColor: Colors.border }]}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.secondaryBtnText, { color: Colors.textSecondary }]}>Back to Explore</Text>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
        gap: 32,
    },
    card: {
        alignItems: 'center',
        gap: 16,
    },
    successCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 30,
        fontWeight: '900',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    pointsBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        width: '100%',
        marginTop: 4,
    },
    pointsBannerIcon: { fontSize: 32 },
    pointsBannerTitle: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
    actions: { gap: 0 },
    primaryBtn: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    secondaryBtn: {
        height: 52,
        borderRadius: 26,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryBtnText: { fontSize: 15, fontWeight: '700' },
});
