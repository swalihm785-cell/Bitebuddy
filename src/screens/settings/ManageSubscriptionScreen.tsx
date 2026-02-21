import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomAlert } from '../../components/common/CustomAlert';
import { isCurrentlyPro } from '../../utils/authUtils';

const { width } = Dimensions.get('window');

export default function ManageSubscriptionScreen() {
    const navigation = useNavigation<any>();
    const { user, cancelSubscription } = useAuthStore();
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;

    const [showCancelAlert, setShowCancelAlert] = useState(false);

    const isPro = isCurrentlyPro(user);
    const isPlanPro = user?.plan === 'pro';
    const isCancelled = user?.subscriptionStatus === 'cancelled';
    const expiryDate = user?.subscriptionExpiryDate ? new Date(user.subscriptionExpiryDate).toLocaleDateString([], { dateStyle: 'long' }) : 'N/A';

    const handleCancel = () => {
        cancelSubscription();
        setShowCancelAlert(false);
        Alert.alert('Subscription Cancelled', 'Your Pro access will remain active until the end of your current period.');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Manage Subscription</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.planCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                    <LinearGradient colors={isPro ? ['#FFD166', '#FF6B35'] : ['#6C63FF', '#4B42E1']} style={styles.planBadge}>
                        <Ionicons name={isPro ? "star" : "person"} size={20} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.planInfo}>
                        <Text style={[styles.planLabel, { color: Colors.textMuted }]}>Current Plan</Text>
                        <Text style={[styles.planName, { color: Colors.textPrimary }]}>{isPro ? 'Pro Member' : 'Free Tier'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: Colors.backgroundElevated }]}>
                        <Text style={[styles.statusText, { color: Colors.textMuted }]}>{isCancelled ? 'CANCELLED' : 'ACTIVE'}</Text>
                    </View>
                </View>

                <View style={[styles.detailsCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                    <DetailRow label="Renewal Date" value={expiryDate} color={Colors.textPrimary} mutedColor={Colors.textMuted} />
                    <View style={[styles.divider, { backgroundColor: Colors.border }]} />
                    <DetailRow label="Billing Cycle" value="Monthly" color={Colors.textPrimary} mutedColor={Colors.textMuted} />
                    <View style={[styles.divider, { backgroundColor: Colors.border }]} />
                    <DetailRow label="Price" value="₹499/month" color={Colors.textPrimary} mutedColor={Colors.textMuted} />
                </View>

                <Text style={[styles.infoText, { color: Colors.textSecondary }]}>
                    {isCancelled
                        ? `Your subscription will expire on ${expiryDate}. After this, you will be downgraded to the Free Tier.`
                        : 'Your subscription will automatically renew. You can cancel at any time below.'}
                </Text>

                {!isCancelled && isPro && (
                    <TouchableOpacity
                        style={[styles.cancelBtn, { borderColor: Colors.error }]}
                        onPress={() => setShowCancelAlert(true)}
                    >
                        <Text style={[styles.cancelBtnText, { color: Colors.error }]}>Cancel Subscription</Text>
                    </TouchableOpacity>
                )}

                {!isPro && (
                    <TouchableOpacity
                        style={styles.upgradeBtn}
                        onPress={() => navigation.navigate('Plan')}
                    >
                        <LinearGradient colors={Colors.gradientPrimary} style={styles.upgradeGradient}>
                            <Text style={styles.upgradeText}>Upgrade to Pro</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <CustomAlert
                visible={showCancelAlert}
                title="Cancel Subscription"
                message="Are you sure you want to cancel? You will keep your Pro features until the end of the current billing cycle."
                confirmText="Yes, Cancel"
                onConfirm={handleCancel}
                onClose={() => setShowCancelAlert(false)}
                type="error"
            />
        </SafeAreaView>
    );
}

const DetailRow = ({ label, value, color, mutedColor }: any) => (
    <View style={styles.detailRow}>
        <Text style={[styles.detailLabel, { color: mutedColor }]}>{label}</Text>
        <Text style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    content: { padding: 20 },
    planCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 20 },
    planBadge: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    planInfo: { flex: 1 },
    planLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    planName: { fontSize: 20, fontWeight: '900', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '900' },
    detailsCard: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 24 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
    detailLabel: { fontSize: 14, fontWeight: '600' },
    detailValue: { fontSize: 14, fontWeight: '800' },
    divider: { height: 1 },
    infoText: { fontSize: 14, lineHeight: 22, textAlign: 'center', paddingHorizontal: 20, marginBottom: 40 },
    cancelBtn: { height: 56, borderRadius: 28, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { fontSize: 16, fontWeight: '800' },
    upgradeBtn: { height: 60, borderRadius: 30, overflow: 'hidden' },
    upgradeGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    upgradeText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
