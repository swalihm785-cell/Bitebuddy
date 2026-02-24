import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

const { width } = Dimensions.get('window');

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: '₹0',
        features: ['Find meals near you', 'Join up to 2 plans/day', 'Basic profile'],
        gradient: ['#6C63FF', '#4B42E1']
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '₹499',
        period: '/month',
        features: ['Unlimited dining plans', 'Post unlimited snaps', 'Verified badge', 'Advanced analytics', 'Priority support'],
        gradient: ['#FFD166', '#FF6B35'],
        isPro: true
    }
];

export default function PlanScreen() {
    const navigation = useNavigation<any>();
    const { user, updateUser } = useAuthStore();
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;

    const handleUpgrade = (planId: 'free' | 'pro') => {
        updateUser({
            plan: planId,
            subscriptionStatus: planId === 'pro' ? 'active' : undefined,
            subscriptionExpiryDate: planId === 'pro' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined
        });
        navigation.goBack();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: Colors.textPrimary }]}>Choose Your Plan</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {PLANS.map(plan => {
                    const isCurrent = user?.plan === plan.id;
                    const gradientColors = plan.gradient as [string, string, ...string[]];
                    return (
                        <View key={plan.id} style={[styles.planCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                            <LinearGradient colors={gradientColors} style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.planName}>{plan.name}</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.planPrice}>{plan.price}</Text>
                                        {plan.period && <Text style={styles.planPeriod}>{plan.period}</Text>}
                                    </View>
                                </View>
                                {isCurrent && (
                                    <View style={styles.currentBadge}>
                                        <Text style={styles.currentText}>CURRENT</Text>
                                    </View>
                                )}
                            </LinearGradient>
                            <View style={styles.cardBody}>
                                {plan.features.map((f, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <Ionicons name="checkmark-circle" size={18} color={plan.isPro ? '#FF6B35' : Colors.primary} />
                                        <Text style={[styles.featureText, { color: Colors.textSecondary }]}>{f}</Text>
                                    </View>
                                ))}
                                <TouchableOpacity
                                    style={[styles.actionBtn, isCurrent && { opacity: 0.5 }]}
                                    disabled={isCurrent}
                                    onPress={() => handleUpgrade(plan.id as any)}
                                >
                                    <LinearGradient colors={gradientColors} style={styles.gradientBtn}>
                                        <Text style={styles.btnText}>{isCurrent ? 'Current Plan' : 'Select Plan'}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    backBtn: { padding: 4, marginRight: 16 },
    title: { fontSize: 22, fontWeight: '900' },
    content: { padding: 20 },
    planCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, marginBottom: 24 },
    cardHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    planName: { color: '#FFF', fontSize: 24, fontWeight: '900' },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
    planPrice: { color: '#FFF', fontSize: 32, fontWeight: '900' },
    planPeriod: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '700', marginLeft: 4 },
    currentBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    currentText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
    cardBody: { padding: 24 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    featureText: { fontSize: 15, fontWeight: '600' },
    actionBtn: { height: 54, borderRadius: 27, overflow: 'hidden', marginTop: 8 },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
