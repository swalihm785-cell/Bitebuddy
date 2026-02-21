import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function SubscriptionPlanScreen() {
    const { currentTheme } = useThemeStore();
    const { Colors, Spacing, FontSize, FontWeight, BorderRadius } = currentTheme;
    const { user, upgradePlan } = useAuthStore();
    const navigation = useNavigation();

    const isPro = user?.plan === 'pro';

    const FEATURES = [
        { name: 'Join Dining Events', free: true, pro: true },
        { name: 'Post Dining Events', free: true, pro: true },
        { name: 'Private Messenger', free: true, pro: true },
        { name: 'Custom Food Selection', free: true, pro: true },
        { name: 'Snap Stories', free: false, pro: true },
        { name: 'Snap Viewer Insights', free: false, pro: true },
        { name: 'Advanced Profile Analytics', free: false, pro: true },
        { name: 'Exclusive Pro Badge', free: false, pro: true },
        { name: 'Early Access to New Features', free: false, pro: true },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary, fontSize: FontSize.lg }]}>Subscription Plan</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroSection}>
                    <LinearGradient colors={Colors.gradientPrimary} style={styles.proBadge}>
                        <Ionicons name="star" size={32} color="#FFF" />
                    </LinearGradient>
                    <Text style={[styles.heroTitle, { color: Colors.textPrimary }]}>Choose Your Experience</Text>
                    <Text style={[styles.heroSub, { color: Colors.textSecondary }]}>Unlock the full potential of Bite Buddy</Text>
                </View>

                {/* Plans Row */}
                <View style={styles.plansContainer}>
                    {/* Free Plan */}
                    <View style={[styles.planCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                        <Text style={[styles.planName, { color: Colors.textPrimary }]}>Free</Text>
                        <Text style={[styles.planPrice, { color: Colors.textSecondary }]}>$0/mo</Text>
                        {user?.plan === 'free' && (
                            <View style={[styles.currentPlanTag, { backgroundColor: Colors.border }]}>
                                <Text style={[styles.currentPlanText, { color: Colors.textSecondary }]}>Current Plan</Text>
                            </View>
                        )}
                    </View>

                    {/* Pro Plan */}
                    <View style={[styles.planCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.primary, borderWidth: 2 }]}>
                        <LinearGradient colors={['#FF6B3520', '#FF3CAC20']} style={StyleSheet.absoluteFill} />
                        <Text style={[styles.planName, { color: Colors.primary }]}>Pro</Text>
                        <Text style={[styles.planPrice, { color: Colors.textPrimary }]}>$9.99/mo</Text>
                        {user?.plan === 'pro' ? (
                            <View style={[styles.currentPlanTag, { backgroundColor: Colors.primary }]}>
                                <Text style={[styles.currentPlanText, { color: '#FFF' }]}>Current Plan</Text>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.upgradeBtn} onPress={upgradePlan}>
                                <LinearGradient colors={Colors.gradientPrimary} style={styles.upgradeGradient}>
                                    <Text style={styles.upgradeBtnText}>Upgrade</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Comparison Table */}
                <View style={[styles.table, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                    <View style={[styles.tableHeader, { borderBottomColor: Colors.border }]}>
                        <Text style={[styles.tableHeaderTitle, { color: Colors.textPrimary, flex: 2 }]}>Feature</Text>
                        <Text style={[styles.tableHeaderTitle, { color: Colors.textSecondary, flex: 1, textAlign: 'center' }]}>Free</Text>
                        <Text style={[styles.tableHeaderTitle, { color: Colors.primary, flex: 1, textAlign: 'center' }]}>Pro</Text>
                    </View>
                    {FEATURES.map((feature, index) => (
                        <View key={index} style={[styles.tableRow, { borderBottomColor: Colors.border }]}>
                            <Text style={[styles.featureName, { color: Colors.textSecondary, flex: 2 }]}>{feature.name}</Text>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Ionicons
                                    name={feature.free ? 'checkmark-circle' : 'close-circle'}
                                    size={20}
                                    color={feature.free ? Colors.success : Colors.error + '40'}
                                />
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Ionicons
                                    name={feature.pro ? 'checkmark-circle' : 'close-circle'}
                                    size={20}
                                    color={feature.pro ? Colors.primary : Colors.error}
                                />
                            </View>
                        </View>
                    ))}
                </View>

                <Text style={[styles.footerText, { color: Colors.textMuted }]}>
                    Subscriptions automatically renew unless cancelled. Payments will be charged to your iTunes/Google account.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    backBtn: { padding: 4 },
    headerTitle: { fontWeight: '700', marginLeft: 16 },
    scrollContent: { padding: 20 },
    heroSection: { alignItems: 'center', marginBottom: 32 },
    proBadge: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    heroTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
    heroSub: { fontSize: 14, textAlign: 'center' },
    plansContainer: { flexDirection: 'row', gap: 16, marginBottom: 32 },
    planCard: { flex: 1, padding: 20, borderRadius: 24, borderWidth: 1, alignItems: 'center', overflow: 'hidden' },
    planName: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    planPrice: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
    currentPlanTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    currentPlanText: { fontSize: 10, fontWeight: '700' },
    upgradeBtn: { width: '100%', height: 40, borderRadius: 20, overflow: 'hidden' },
    upgradeGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    upgradeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    table: { borderRadius: 24, borderWidth: 1, padding: 16 },
    tableHeader: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1 },
    tableHeaderTitle: { fontWeight: '700', fontSize: 14 },
    tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, alignItems: 'center' },
    featureName: { fontSize: 13 },
    footerText: { fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 16, paddingHorizontal: 20 },
});
